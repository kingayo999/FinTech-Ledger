export interface User {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
}

export interface AuthState {
    user: User | null;
    token: string | null;
}
