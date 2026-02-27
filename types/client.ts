export type ClientID = number;
export type ClientEmail = string;
export type ClientSubId = string;
export type inbound = number;
export type ClientSecurity = "auto" | string;

export default interface Client {
  id: ClientID[];
  security: ClientSecurity;
  email: ClientEmail[];
  limitIp: number;
  totalGB: number;
  expiryTime: number;
  enable: boolean;
  tgId: string;
  subId: ClientSubId;
  reset: number;
  down: number;
  up: number;
  inbound: inbound[];
}
