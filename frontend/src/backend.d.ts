import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: string;
    name: string;
    description: string;
    currency: string;
    priceInCents: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface RefundRequest {
    status: RefundStatus;
    processedAt?: bigint;
    amount: bigint;
    appointmentId: string;
    requestedAt: bigint;
}
export interface DailySchedule {
    lunchBreaks: Array<string>;
    date: string;
    isOpen: boolean;
    availableStylists: bigint;
}
export interface Stylist {
    id: string;
    lunchBreakStart?: string;
    name: string;
    isAvailable: boolean;
    lunchBreakEnd?: string;
    isOnLunchBreak: boolean;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Appointment {
    id: string;
    status: AppointmentStatus;
    depositAmount: bigint;
    assignedStylist?: string;
    paymentStatus: PaymentStatus;
    stylistRequest?: string;
    date: string;
    createdAt: bigint;
    parentPhone: string;
    updatedAt: bigint;
    childFirstName: string;
    childLastName: string;
    refundEligible: boolean;
    timeSlot: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface EffectSettings {
    tone: number;
    speed: number;
    preset?: VoiceEffectPreset;
    pitch: number;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface TTSAudio {
    id: string;
    createdAt: bigint;
    text: string;
    audioBlob: ExternalBlob;
    voiceProfileId?: string;
    effectSettings: EffectSettings;
}
export interface VoiceProfile {
    id: string;
    userId: Principal;
    name: string;
    createdAt: bigint;
    audioBlob?: ExternalBlob;
    updatedAt: bigint;
    trainingStatus: TrainingStatus;
    referencePhrases: Array<string>;
}
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export enum AppointmentStatus {
    cancelled = "cancelled",
    completed = "completed",
    booked = "booked",
    confirmed = "confirmed"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid",
    refunded = "refunded",
    notRequired = "notRequired"
}
export enum RefundStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected",
    processed = "processed"
}
export enum TrainingStatus {
    notStarted = "notStarted",
    completed = "completed",
    inProgress = "inProgress",
    failed = "failed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VoiceEffectPreset {
    reverb = "reverb",
    alien = "alien",
    deep = "deep",
    echo = "echo",
    robotic = "robotic",
    chipmunk = "chipmunk"
}
export interface backendInterface {
    addDailySchedule(schedule: DailySchedule): Promise<void>;
    addProduct(product: Product): Promise<void>;
    addStylist(stylist: Stylist): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelAppointment(id: string): Promise<void>;
    createAppointment(appointment: Appointment): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createVoiceProfile(name: string, referencePhrases: Array<string>): Promise<string>;
    deleteDailySchedule(date: string): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    deleteStylist(id: string): Promise<void>;
    deleteTTSAudio(audioId: string): Promise<void>;
    deleteVoiceProfile(profileId: string): Promise<void>;
    getAppointment(id: string): Promise<Appointment | null>;
    getAppointments(): Promise<Array<Appointment>>;
    getAppointmentsByDate(date: string): Promise<Array<Appointment>>;
    getAppointmentsByDateAndTimeSlot(date: string, timeSlot: string): Promise<Array<Appointment>>;
    getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Array<Appointment>>;
    getAppointmentsByDateRangeAndStatus(startDate: string, endDate: string, status: AppointmentStatus): Promise<Array<Appointment>>;
    getAppointmentsByDateRangeAndTimeSlot(startDate: string, endDate: string, timeSlot: string): Promise<Array<Appointment>>;
    getAppointmentsByPhone(phone: string): Promise<Array<Appointment>>;
    getAppointmentsByPhoneAndDateRange(phone: string, startDate: string, endDate: string): Promise<Array<Appointment>>;
    getAppointmentsByStatus(status: AppointmentStatus): Promise<Array<Appointment>>;
    getAppointmentsByStatusAndDate(status: AppointmentStatus, date: string): Promise<Array<Appointment>>;
    getAppointmentsByStatusAndDateRange(status: AppointmentStatus, startDate: string, endDate: string): Promise<Array<Appointment>>;
    getAppointmentsByStatusAndTimeSlot(status: AppointmentStatus, timeSlot: string): Promise<Array<Appointment>>;
    getAppointmentsByStatusAndTimeSlotAndDateRange(status: AppointmentStatus, timeSlot: string, startDate: string, endDate: string): Promise<Array<Appointment>>;
    getAppointmentsByStylist(stylistId: string): Promise<Array<Appointment>>;
    getAppointmentsByStylistAndDateRange(stylistId: string, startDate: string, endDate: string): Promise<Array<Appointment>>;
    getAppointmentsByTimeSlot(timeSlot: string): Promise<Array<Appointment>>;
    getAvailableDays(): Promise<Array<string>>;
    getAvailableSlotsForDay(date: string): Promise<Array<string>>;
    getAvailableSlotsForStylist(stylistId: string, date: string): Promise<Array<string>>;
    getAvailableStylistsForSlot(date: string, timeSlot: string): Promise<Array<Stylist>>;
    getAvailableTimeSlots(date: string): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClosedDays(): Promise<Array<string>>;
    getDailySchedules(): Promise<Array<DailySchedule>>;
    getLunchBreaksForDate(date: string): Promise<Array<Stylist>>;
    getProducts(): Promise<Array<Product>>;
    getRefundRequests(): Promise<Array<RefundRequest>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getStylistAvailability(date: string): Promise<Array<Stylist>>;
    getStylists(): Promise<Array<Stylist>>;
    getTTSAudio(): Promise<Array<TTSAudio>>;
    getTTSAudioById(audioId: string): Promise<TTSAudio | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVoiceProfile(profileId: string): Promise<VoiceProfile | null>;
    getVoiceProfiles(): Promise<Array<VoiceProfile>>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    processRefund(appointmentId: string, approve: boolean): Promise<void>;
    requestRefund(appointmentId: string, amount: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveTTSAudio(text: string, voiceProfileId: string | null, audioBlob: ExternalBlob, effectSettings: EffectSettings): Promise<string>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAppointment(appointment: Appointment): Promise<void>;
    updateDailySchedule(schedule: DailySchedule): Promise<void>;
    updateDailyStylistCount(date: string, count: bigint): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    updateStylist(stylist: Stylist): Promise<void>;
    updateStylistLunchBreak(stylistId: string, isOnBreak: boolean, start: string | null, end: string | null): Promise<void>;
    updateTrainingStatus(profileId: string, status: TrainingStatus): Promise<void>;
    updateVoiceProfile(profileId: string, referencePhrases: Array<string>): Promise<void>;
}