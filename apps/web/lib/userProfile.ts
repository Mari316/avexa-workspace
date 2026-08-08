export type UserProfile = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
};

const initialProfile: UserProfile = {
  firstName: "Mari",
  lastName: "Astapova",
  role: "Senior QA Engineer",
  email: "mari@avexa.test",
};

type UserProfileListener = () => void;

let profile: UserProfile = { ...initialProfile };
const listeners = new Set<UserProfileListener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeUserProfile(listener: UserProfileListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getUserProfile(): UserProfile {
  return profile;
}

export function getUserFirstName(): string {
  return profile.firstName;
}

export function getUserFullName(): string {
  return `${profile.firstName} ${profile.lastName}`;
}

export function updateUserProfile(
  updates: Pick<UserProfile, "firstName" | "lastName" | "email">,
): void {
  profile = {
    ...profile,
    firstName: updates.firstName.trim(),
    lastName: updates.lastName.trim(),
    email: updates.email.trim(),
  };
  notifyListeners();
}
