import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import List "mo:base/List";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Migration "migration";
import Int "mo:base/Int";

import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

(with migration = Migration.run)
actor AppointmentSystem {
  let storage = Storage.new();
  include MixinStorage(storage);

  public type Appointment = {
    id : Text;
    childFirstName : Text;
    childLastName : Text;
    parentPhone : Text;
    stylistRequest : ?Text;
    timeSlot : Text;
    date : Text;
    status : AppointmentStatus;
    paymentStatus : PaymentStatus;
    createdAt : Int;
    updatedAt : Int;
    assignedStylist : ?Text;
    depositAmount : Nat;
    refundEligible : Bool;
  };

  public type AppointmentStatus = {
    #booked;
    #confirmed;
    #cancelled;
    #completed;
  };

  public type PaymentStatus = {
    #pending;
    #paid;
    #refunded;
    #notRequired;
  };

  public type Stylist = {
    id : Text;
    name : Text;
    isAvailable : Bool;
    isOnLunchBreak : Bool;
    lunchBreakStart : ?Text;
    lunchBreakEnd : ?Text;
  };

  public type DailySchedule = {
    date : Text;
    availableStylists : Nat;
    isOpen : Bool;
    lunchBreaks : [Text];
  };

  public type UserProfile = {
    name : Text;
    phone : Text;
    email : Text;
  };

  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    priceInCents : Nat;
    currency : Text;
  };

  public type RefundRequest = {
    appointmentId : Text;
    amount : Nat;
    status : RefundStatus;
    requestedAt : Int;
    processedAt : ?Int;
  };

  public type RefundStatus = {
    #pending;
    #approved;
    #rejected;
    #processed;
  };

  public type VoiceProfile = {
    id : Text;
    name : Text;
    userId : Principal;
    referencePhrases : [Text];
    createdAt : Int;
    updatedAt : Int;
    trainingStatus : TrainingStatus;
    audioBlob : ?Storage.ExternalBlob;
  };

  public type TrainingStatus = {
    #notStarted;
    #inProgress;
    #completed;
    #failed;
  };

  public type TTSAudio = {
    id : Text;
    text : Text;
    voiceProfileId : ?Text;
    audioBlob : Storage.ExternalBlob;
    createdAt : Int;
    effectSettings : EffectSettings;
  };

  public type EffectSettings = {
    pitch : Float;
    speed : Float;
    tone : Float;
    preset : ?VoiceEffectPreset;
  };

  public type VoiceEffectPreset = {
    #robotic;
    #chipmunk;
    #deep;
    #alien;
    #echo;
    #reverb;
  };

  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  var appointments : OrderedMap.Map<Text, Appointment> = textMap.empty();
  var stylists : OrderedMap.Map<Text, Stylist> = textMap.empty();
  var dailySchedules : OrderedMap.Map<Text, DailySchedule> = textMap.empty();
  var products : OrderedMap.Map<Text, Product> = textMap.empty();
  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty();
  var refundRequests : OrderedMap.Map<Text, RefundRequest> = textMap.empty();
  var voiceProfiles : OrderedMap.Map<Text, VoiceProfile> = textMap.empty();
  var ttsAudio : OrderedMap.Map<Text, TTSAudio> = textMap.empty();

  let accessControlState = AccessControl.initState();
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public query func getAppointments() : async [Appointment] {
    Iter.toArray(textMap.vals(appointments));
  };

  public query func getAppointment(id : Text) : async ?Appointment {
    textMap.get(appointments, id);
  };

  public shared ({ caller }) func createAppointment(appointment : Appointment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create appointments");
    };
    appointments := textMap.put(appointments, appointment.id, appointment);
  };

  public shared ({ caller }) func updateAppointment(appointment : Appointment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update appointments");
    };
    appointments := textMap.put(appointments, appointment.id, appointment);
  };

  public shared ({ caller }) func cancelAppointment(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can cancel appointments");
    };
    appointments := textMap.delete(appointments, id);
  };

  public query func getStylists() : async [Stylist] {
    Iter.toArray(textMap.vals(stylists));
  };

  public shared ({ caller }) func addStylist(stylist : Stylist) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add stylists");
    };
    stylists := textMap.put(stylists, stylist.id, stylist);
  };

  public shared ({ caller }) func updateStylist(stylist : Stylist) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update stylists");
    };
    stylists := textMap.put(stylists, stylist.id, stylist);
  };

  public shared ({ caller }) func deleteStylist(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete stylists");
    };
    stylists := textMap.delete(stylists, id);
  };

  public query func getDailySchedules() : async [DailySchedule] {
    Iter.toArray(textMap.vals(dailySchedules));
  };

  public shared ({ caller }) func addDailySchedule(schedule : DailySchedule) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add daily schedules");
    };
    dailySchedules := textMap.put(dailySchedules, schedule.date, schedule);
  };

  public shared ({ caller }) func updateDailySchedule(schedule : DailySchedule) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update daily schedules");
    };
    dailySchedules := textMap.put(dailySchedules, schedule.date, schedule);
  };

  public shared ({ caller }) func deleteDailySchedule(date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete daily schedules");
    };
    dailySchedules := textMap.delete(dailySchedules, date);
  };

  public query func getProducts() : async [Product] {
    Iter.toArray(textMap.vals(products));
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add products");
    };
    products := textMap.put(products, product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update products");
    };
    products := textMap.put(products, product.id, product);
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete products");
    };
    products := textMap.delete(products, id);
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can set Stripe configuration");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) Debug.trap("Stripe needs to be first configured");
      case (?value) value;
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getAvailableTimeSlots(date : Text) : async [Text] {
    let slots = [
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM",
    ];

    var availableSlots = List.fromArray(slots);

    switch (textMap.get(dailySchedules, date)) {
      case (null) { List.toArray(availableSlots) };
      case (?schedule) {
        if (not schedule.isOpen) {
          return [];
        };

        var bookedSlots = List.fromArray(slots);
        for (appointment in textMap.vals(appointments)) {
          if (appointment.date == date and appointment.status != #cancelled) {
            let remaining = List.filter<Text>(
              bookedSlots,
              func(slot) { slot != appointment.timeSlot },
            );
            bookedSlots := remaining;
          };
        };

        List.toArray(bookedSlots);
      };
    };
  };

  public func getStylistAvailability(date : Text) : async [Stylist] {
    var availableStylists = List.nil<Stylist>();
    for (stylist in textMap.vals(stylists)) {
      if (stylist.isAvailable and not stylist.isOnLunchBreak) {
        availableStylists := List.push(stylist, availableStylists);
      };
    };
    List.toArray(availableStylists);
  };

  public func getAppointmentsByDate(date : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.date == date) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByStatus(status : AppointmentStatus) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.status == status) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByPhone(phone : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.parentPhone == phone) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByStylist(stylistId : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      switch (appointment.stylistRequest) {
        case (null) {};
        case (?requestedStylist) {
          if (requestedStylist == stylistId) {
            appointmentsList := List.push(appointment, appointmentsList);
          };
        };
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByDateRange(startDate : Text, endDate : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.date >= startDate and appointment.date <= endDate) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByTimeSlot(timeSlot : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.timeSlot == timeSlot) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByStatusAndDate(status : AppointmentStatus, date : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.status == status and appointment.date == date) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByStatusAndTimeSlot(status : AppointmentStatus, timeSlot : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.status == status and appointment.timeSlot == timeSlot) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByDateAndTimeSlot(date : Text, timeSlot : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.date == date and appointment.timeSlot == timeSlot) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByDateRangeAndStatus(startDate : Text, endDate : Text, status : AppointmentStatus) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.date >= startDate and appointment.date <= endDate and appointment.status == status) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByDateRangeAndTimeSlot(startDate : Text, endDate : Text, timeSlot : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.date >= startDate and appointment.date <= endDate and appointment.timeSlot == timeSlot) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByStatusAndDateRange(status : AppointmentStatus, startDate : Text, endDate : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.status == status and appointment.date >= startDate and appointment.date <= endDate) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByStatusAndTimeSlotAndDateRange(status : AppointmentStatus, timeSlot : Text, startDate : Text, endDate : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.status == status and appointment.timeSlot == timeSlot and appointment.date >= startDate and appointment.date <= endDate) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByPhoneAndDateRange(phone : Text, startDate : Text, endDate : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      if (appointment.parentPhone == phone and appointment.date >= startDate and appointment.date <= endDate) {
        appointmentsList := List.push(appointment, appointmentsList);
      };
    };
    List.toArray(appointmentsList);
  };

  public func getAppointmentsByStylistAndDateRange(stylistId : Text, startDate : Text, endDate : Text) : async [Appointment] {
    var appointmentsList = List.nil<Appointment>();
    for (appointment in textMap.vals(appointments)) {
      switch (appointment.stylistRequest) {
        case (null) {};
        case (?requestedStylist) {
          if (requestedStylist == stylistId and appointment.date >= startDate and appointment.date <= endDate) {
            appointmentsList := List.push(appointment, appointmentsList);
          };
        };
      };
    };
    List.toArray(appointmentsList);
  };

  public shared ({ caller }) func requestRefund(appointmentId : Text, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can request refunds");
    };

    let refundRequest = {
      appointmentId;
      amount;
      status = #pending;
      requestedAt = Time.now();
      processedAt = null;
    };

    refundRequests := textMap.put(refundRequests, appointmentId, refundRequest);
  };

  public query ({ caller }) func getRefundRequests() : async [RefundRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view refund requests");
    };
    Iter.toArray(textMap.vals(refundRequests));
  };

  public shared ({ caller }) func processRefund(appointmentId : Text, approve : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can process refunds");
    };

    switch (textMap.get(refundRequests, appointmentId)) {
      case (null) {
        Debug.trap("Refund request not found");
      };
      case (?refundRequest) {
        let updatedRequest = {
          refundRequest with
          status = if (approve) #approved else #rejected;
          processedAt = ?Time.now();
        };
        refundRequests := textMap.put(refundRequests, appointmentId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func updateStylistLunchBreak(stylistId : Text, isOnBreak : Bool, start : ?Text, end : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update lunch breaks");
    };

    switch (textMap.get(stylists, stylistId)) {
      case (null) {
        Debug.trap("Stylist not found");
      };
      case (?stylist) {
        let updatedStylist = {
          stylist with
          isOnLunchBreak = isOnBreak;
          lunchBreakStart = start;
          lunchBreakEnd = end;
        };
        stylists := textMap.put(stylists, stylistId, updatedStylist);
      };
    };
  };

  public shared ({ caller }) func updateDailyStylistCount(date : Text, count : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update daily stylist count");
    };

    switch (textMap.get(dailySchedules, date)) {
      case (null) {
        Debug.trap("Daily schedule not found");
      };
      case (?schedule) {
        let updatedSchedule = {
          schedule with
          availableStylists = count;
          isOpen = count > 0;
        };
        dailySchedules := textMap.put(dailySchedules, date, updatedSchedule);
      };
    };
  };

  public func getAvailableStylistsForSlot(date : Text, timeSlot : Text) : async [Stylist] {
    var availableStylists = List.nil<Stylist>();
    for (stylist in textMap.vals(stylists)) {
      if (stylist.isAvailable and not stylist.isOnLunchBreak) {
        var isBooked = false;
        for (appointment in textMap.vals(appointments)) {
          if (appointment.date == date and appointment.timeSlot == timeSlot and appointment.assignedStylist == ?stylist.id) {
            isBooked := true;
          };
        };
        if (not isBooked) {
          availableStylists := List.push(stylist, availableStylists);
        };
      };
    };
    List.toArray(availableStylists);
  };

  public func getLunchBreaksForDate(date : Text) : async [Stylist] {
    var lunchBreakStylists = List.nil<Stylist>();
    for (stylist in textMap.vals(stylists)) {
      if (stylist.isOnLunchBreak) {
        lunchBreakStylists := List.push(stylist, lunchBreakStylists);
      };
    };
    List.toArray(lunchBreakStylists);
  };

  public func getClosedDays() : async [Text] {
    var closedDays = List.nil<Text>();
    for (schedule in textMap.vals(dailySchedules)) {
      if (not schedule.isOpen) {
        closedDays := List.push(schedule.date, closedDays);
      };
    };
    List.toArray(closedDays);
  };

  public func getAvailableDays() : async [Text] {
    var availableDays = List.nil<Text>();
    for (schedule in textMap.vals(dailySchedules)) {
      if (schedule.isOpen) {
        availableDays := List.push(schedule.date, availableDays);
      };
    };
    List.toArray(availableDays);
  };

  public func getAvailableSlotsForDay(date : Text) : async [Text] {
    let slots = [
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM",
    ];

    var availableSlots = List.fromArray(slots);

    switch (textMap.get(dailySchedules, date)) {
      case (null) { List.toArray(availableSlots) };
      case (?schedule) {
        if (not schedule.isOpen) {
          return [];
        };

        var bookedSlots = List.fromArray(slots);
        for (appointment in textMap.vals(appointments)) {
          if (appointment.date == date and appointment.status != #cancelled) {
            let remaining = List.filter<Text>(
              bookedSlots,
              func(slot) { slot != appointment.timeSlot },
            );
            bookedSlots := remaining;
          };
        };

        List.toArray(bookedSlots);
      };
    };
  };

  public func getAvailableSlotsForStylist(stylistId : Text, date : Text) : async [Text] {
    let slots = [
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM",
    ];

    var availableSlots = List.fromArray(slots);

    switch (textMap.get(stylists, stylistId)) {
      case (null) { List.toArray(availableSlots) };
      case (?stylist) {
        if (not stylist.isAvailable or stylist.isOnLunchBreak) {
          return [];
        };

        var bookedSlots = List.fromArray(slots);
        for (appointment in textMap.vals(appointments)) {
          if (appointment.date == date and appointment.assignedStylist == ?stylistId and appointment.status != #cancelled) {
            let remaining = List.filter<Text>(
              bookedSlots,
              func(slot) { slot != appointment.timeSlot },
            );
            bookedSlots := remaining;
          };
        };

        List.toArray(bookedSlots);
      };
    };
  };

  // Voice Profile Management
  public shared ({ caller }) func createVoiceProfile(name : Text, referencePhrases : [Text]) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create voice profiles");
    };

    let profileId = Text.concat(name, Int.toText(Time.now()));
    let voiceProfile = {
      id = profileId;
      name;
      userId = caller;
      referencePhrases;
      createdAt = Time.now();
      updatedAt = Time.now();
      trainingStatus = #notStarted;
      audioBlob = null;
    };

    voiceProfiles := textMap.put(voiceProfiles, profileId, voiceProfile);
    profileId;
  };

  public shared ({ caller }) func updateVoiceProfile(profileId : Text, referencePhrases : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update voice profiles");
    };

    switch (textMap.get(voiceProfiles, profileId)) {
      case (null) {
        Debug.trap("Voice profile not found");
      };
      case (?profile) {
        if (profile.userId != caller) {
          Debug.trap("Unauthorized: Cannot update another user's profile");
        };

        let updatedProfile = {
          profile with
          referencePhrases;
          updatedAt = Time.now();
        };
        voiceProfiles := textMap.put(voiceProfiles, profileId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func deleteVoiceProfile(profileId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete voice profiles");
    };

    switch (textMap.get(voiceProfiles, profileId)) {
      case (null) {
        Debug.trap("Voice profile not found");
      };
      case (?profile) {
        if (profile.userId != caller) {
          Debug.trap("Unauthorized: Cannot delete another user's profile");
        };
        voiceProfiles := textMap.delete(voiceProfiles, profileId);
      };
    };
  };

  public query ({ caller }) func getVoiceProfiles() : async [VoiceProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view voice profiles");
    };
    var userProfiles = List.nil<VoiceProfile>();
    for (profile in textMap.vals(voiceProfiles)) {
      if (profile.userId == caller) {
        userProfiles := List.push(profile, userProfiles);
      };
    };
    List.toArray(userProfiles);
  };

  public query ({ caller }) func getVoiceProfile(profileId : Text) : async ?VoiceProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view voice profiles");
    };
    switch (textMap.get(voiceProfiles, profileId)) {
      case (null) { null };
      case (?profile) {
        if (profile.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Cannot view another user's profile");
        };
        ?profile;
      };
    };
  };

  public shared ({ caller }) func updateTrainingStatus(profileId : Text, status : TrainingStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update training status");
    };

    switch (textMap.get(voiceProfiles, profileId)) {
      case (null) {
        Debug.trap("Voice profile not found");
      };
      case (?profile) {
        if (profile.userId != caller) {
          Debug.trap("Unauthorized: Cannot update another user's profile");
        };

        let updatedProfile = {
          profile with
          trainingStatus = status;
          updatedAt = Time.now();
        };
        voiceProfiles := textMap.put(voiceProfiles, profileId, updatedProfile);
      };
    };
  };

  // TTS Audio Management
  public shared ({ caller }) func saveTTSAudio(text : Text, voiceProfileId : ?Text, audioBlob : Storage.ExternalBlob, effectSettings : EffectSettings) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save TTS audio");
    };

    switch (voiceProfileId) {
      case (null) {};
      case (?profileId) {
        switch (textMap.get(voiceProfiles, profileId)) {
          case (null) {
            Debug.trap("Voice profile not found");
          };
          case (?profile) {
            if (profile.userId != caller) {
              Debug.trap("Unauthorized: Cannot use another user's voice profile");
            };
          };
        };
      };
    };

    let audioId = Text.concat("tts_", Int.toText(Time.now()));
    let ttsAudioEntry = {
      id = audioId;
      text;
      voiceProfileId;
      audioBlob;
      createdAt = Time.now();
      effectSettings;
    };

    ttsAudio := textMap.put(ttsAudio, audioId, ttsAudioEntry);
    audioId;
  };

  public query ({ caller }) func getTTSAudio() : async [TTSAudio] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view TTS audio");
    };
    var userAudio = List.nil<TTSAudio>();
    for (audio in textMap.vals(ttsAudio)) {
      switch (audio.voiceProfileId) {
        case (null) {
          userAudio := List.push(audio, userAudio);
        };
        case (?profileId) {
          switch (textMap.get(voiceProfiles, profileId)) {
            case (null) {};
            case (?profile) {
              if (profile.userId == caller) {
                userAudio := List.push(audio, userAudio);
              };
            };
          };
        };
      };
    };
    List.toArray(userAudio);
  };

  public query ({ caller }) func getTTSAudioById(audioId : Text) : async ?TTSAudio {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view TTS audio");
    };
    switch (textMap.get(ttsAudio, audioId)) {
      case (null) { null };
      case (?audio) {
        switch (audio.voiceProfileId) {
          case (null) { ?audio };
          case (?profileId) {
            switch (textMap.get(voiceProfiles, profileId)) {
              case (null) { ?audio };
              case (?profile) {
                if (profile.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                  Debug.trap("Unauthorized: Cannot view another user's audio");
                };
                ?audio;
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteTTSAudio(audioId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete TTS audio");
    };

    switch (textMap.get(ttsAudio, audioId)) {
      case (null) {
        Debug.trap("TTS audio not found");
      };
      case (?audio) {
        switch (audio.voiceProfileId) {
          case (null) {
            ttsAudio := textMap.delete(ttsAudio, audioId);
          };
          case (?profileId) {
            switch (textMap.get(voiceProfiles, profileId)) {
              case (null) {
                ttsAudio := textMap.delete(ttsAudio, audioId);
              };
              case (?profile) {
                if (profile.userId != caller) {
                  Debug.trap("Unauthorized: Cannot delete another user's audio");
                };
                ttsAudio := textMap.delete(ttsAudio, audioId);
              };
            };
          };
        };
      };
    };
  };
};

