export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "staff";
};
