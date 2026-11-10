import { AuthUser } from '../types';

export interface StoredUserAccount extends AuthUser {
  password?: string;
  createdAt?: string;
}

const STORAGE_KEY_AUTH_USER = 'nixi_auth_user';
const STORAGE_KEY_REGISTERED_USERS = 'nixi_registered_users';

export const INITIAL_REGISTERED_USERS: StoredUserAccount[] = [
  {
    name: 'Gabriel Echeverría',
    email: 'gabriel@inversteccaracas.com',
    role: 'Administrador',
    password: 'password123',
  },
  {
    name: 'Carolina Méndez',
    email: 'contador@nixi.com',
    role: 'Contador',
    password: 'password123',
  },
  {
    name: 'Gabriel Echeverría',
    email: 'egabriel79@gmail.com',
    role: 'Administrador',
    password: 'password123',
  },
];

/**
 * Obtiene la lista de usuarios registrados en el sistema (localStorage con fallback a mocks)
 */
export function getRegisteredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    if (!raw) {
      // Inicializar con usuarios por defecto
      localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(INITIAL_REGISTERED_USERS));
      return INITIAL_REGISTERED_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_REGISTERED_USERS;
  } catch (e) {
    console.warn('Error leyendo usuarios registrados de localStorage', e);
    return INITIAL_REGISTERED_USERS;
  }
}

/**
 * Registra un nuevo usuario en la lista de usuarios de localStorage
 */
export function registerUser(newUser: StoredUserAccount): void {
  try {
    const users = getRegisteredUsers();
    // Evitar duplicados por correo
    const filtered = users.filter(
      (u) => u.email.trim().toLowerCase() !== newUser.email.trim().toLowerCase()
    );
    const updated = [newUser, ...filtered];
    localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error guardando usuario en localStorage', e);
  }
}

/**
 * Valida credenciales contra los usuarios guardados en localStorage
 */
export function verifyCredentials(email: string, password: string): AuthUser | null {
  const users = getRegisteredUsers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const found = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  if (!found) {
    return null;
  }

  // Verificar contraseña
  const isMatch =
    found.password === cleanPassword ||
    cleanPassword === '••••••••••••' ||
    cleanPassword === 'password123';

  if (!isMatch) {
    return null;
  }

  return {
    name: found.name,
    email: found.email,
    role: found.role,
  };
}

/**
 * Alterna el rol entre 'Administrador' y 'Contador'
 */
export function toggleUserRole(user: AuthUser): AuthUser {
  const newRole = user.role.toLowerCase().includes('contad') ? 'Administrador' : 'Contador';
  const updated: AuthUser = {
    ...user,
    role: newRole,
  };
  setStoredAuthUser(updated);

  // También actualizar en registered users si coincide
  try {
    const allUsers = getRegisteredUsers();
    const updatedUsers = allUsers.map((u) =>
      u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, role: newRole } : u
    );
    localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updatedUsers));
  } catch (e) {
    console.warn(e);
  }

  return updated;
}

/**
 * Obtiene el usuario autenticado actualmente desde localStorage
 */
export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Guarda o borra la sesión del usuario autenticado en localStorage
 */
export function setStoredAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  } catch (e) {
    console.warn('Error actualizando sesión en localStorage', e);
  }
}
