import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Storage "blob-storage/Storage";

module {
  type OldAppointment = {
    id : Text;
    childFirstName : Text;
    childLastName : Text;
    parentPhone : Text;
    stylistRequest : ?Text;
    timeSlot : Text;
    date : Text;
    status : {
      #booked;
      #confirmed;
      #cancelled;
      #completed;
    };
    paymentStatus : {
      #pending;
      #paid;
      #refunded;
      #notRequired;
    };
    createdAt : Int;
    updatedAt : Int;
    assignedStylist : ?Text;
    depositAmount : Nat;
    refundEligible : Bool;
  };

  type OldStylist = {
    id : Text;
    name : Text;
    isAvailable : Bool;
    isOnLunchBreak : Bool;
    lunchBreakStart : ?Text;
    lunchBreakEnd : ?Text;
  };

  type OldDailySchedule = {
    date : Text;
    availableStylists : Nat;
    isOpen : Bool;
    lunchBreaks : [Text];
  };

  type OldUserProfile = {
    name : Text;
    phone : Text;
    email : Text;
  };

  type OldProduct = {
    id : Text;
    name : Text;
    description : Text;
    priceInCents : Nat;
    currency : Text;
  };

  type OldRefundRequest = {
    appointmentId : Text;
    amount : Nat;
    status : {
      #pending;
      #approved;
      #rejected;
      #processed;
    };
    requestedAt : Int;
    processedAt : ?Int;
  };

  type OldActor = {
    appointments : OrderedMap.Map<Text, OldAppointment>;
    stylists : OrderedMap.Map<Text, OldStylist>;
    dailySchedules : OrderedMap.Map<Text, OldDailySchedule>;
    products : OrderedMap.Map<Text, OldProduct>;
    userProfiles : OrderedMap.Map<Principal, OldUserProfile>;
    refundRequests : OrderedMap.Map<Text, OldRefundRequest>;
  };

  type NewAppointment = OldAppointment;
  type NewStylist = OldStylist;
  type NewDailySchedule = OldDailySchedule;
  type NewUserProfile = OldUserProfile;
  type NewProduct = OldProduct;
  type NewRefundRequest = OldRefundRequest;

  type VoiceProfile = {
    id : Text;
    name : Text;
    userId : Principal;
    referencePhrases : [Text];
    createdAt : Int;
    updatedAt : Int;
    trainingStatus : {
      #notStarted;
      #inProgress;
      #completed;
      #failed;
    };
    audioBlob : ?Storage.ExternalBlob;
  };

  type TTSAudio = {
    id : Text;
    text : Text;
    voiceProfileId : ?Text;
    audioBlob : Storage.ExternalBlob;
    createdAt : Int;
    effectSettings : {
      pitch : Float;
      speed : Float;
      tone : Float;
      preset : ?{
        #robotic;
        #chipmunk;
        #deep;
        #alien;
        #echo;
        #reverb;
      };
    };
  };

  type NewActor = {
    appointments : OrderedMap.Map<Text, NewAppointment>;
    stylists : OrderedMap.Map<Text, NewStylist>;
    dailySchedules : OrderedMap.Map<Text, NewDailySchedule>;
    products : OrderedMap.Map<Text, NewProduct>;
    userProfiles : OrderedMap.Map<Principal, NewUserProfile>;
    refundRequests : OrderedMap.Map<Text, NewRefundRequest>;
    voiceProfiles : OrderedMap.Map<Text, VoiceProfile>;
    ttsAudio : OrderedMap.Map<Text, TTSAudio>;
  };

  public func run(old : OldActor) : NewActor {
    let textMap = OrderedMap.Make<Text>(Text.compare);
    {
      appointments = old.appointments;
      stylists = old.stylists;
      dailySchedules = old.dailySchedules;
      products = old.products;
      userProfiles = old.userProfiles;
      refundRequests = old.refundRequests;
      voiceProfiles = textMap.empty<VoiceProfile>();
      ttsAudio = textMap.empty<TTSAudio>();
    };
  };
};

