import dayjs from 'dayjs';
import type { AppUser } from '../types/shared';

interface StoredUser extends AppUser {
  password: string;
}

const guestUser: AppUser = {
  id: 'guest',
  username: '访客',
  companyNote: 'Mock Data',
  status: 'guest',
  registeredAt: '2026-07-08 00:00:00',
};

let users: StoredUser[] = [
  {
    id: 'admin-wyt',
    username: 'wyt',
    password: 'wyt123456',
    companyNote: '系统管理员',
    status: 'approved',
    registeredAt: '2026-07-08 00:00:00',
    isAdmin: true,
  },
  {
    id: 'demo-pending',
    username: 'demo_pending',
    password: '123456',
    companyNote: '待审核示例账号',
    status: 'pending',
    registeredAt: '2026-07-08 09:30:00',
  },
];

let currentUser: AppUser = guestUser;

function delay(ms = 180) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function publicUser(user: StoredUser): AppUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function getCurrentUserSync() {
  return currentUser;
}

export async function getCurrentUser() {
  await delay();
  return currentUser;
}

export async function login(username: string, password: string) {
  await delay();
  const user = users.find(
    (item) => item.username === username && item.password === password,
  );

  if (!user) {
    throw new Error('用户名或密码错误');
  }

  currentUser = publicUser(user);
  return currentUser;
}

export async function register(
  username: string,
  password: string,
  companyNote: string,
) {
  await delay();
  if (users.some((item) => item.username === username)) {
    throw new Error('用户名已存在');
  }

  const user: StoredUser = {
    id: `user-${Date.now()}`,
    username,
    password,
    companyNote,
    status: 'pending',
    registeredAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };

  users = [user, ...users];
  currentUser = publicUser(user);
  return currentUser;
}

export async function logout() {
  await delay();
  currentUser = guestUser;
  return currentUser;
}

export async function continueAsGuest() {
  await delay();
  currentUser = guestUser;
  return currentUser;
}

export async function getPendingUsers() {
  await delay();
  return users
    .filter((user) => !user.isAdmin)
    .map(publicUser)
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
}

export async function approveUser(userId: string) {
  await delay();
  users = users.map((user) =>
    user.id === userId ? { ...user, status: 'approved' } : user,
  );
  return getPendingUsers();
}

export async function rejectUser(userId: string) {
  await delay();
  users = users.map((user) =>
    user.id === userId ? { ...user, status: 'rejected' } : user,
  );
  return getPendingUsers();
}
