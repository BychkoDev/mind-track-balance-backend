export class UserCreatedEvent {
  uuid: string;
  email: string;
  name?: string;
  serviceCodeUUID?: string;
}
