export interface ContactType {
    id: number;
    type_name: string;
}

export interface ContactInfo {
    id: number;
    contact_type: ContactType;
    value: string;
}