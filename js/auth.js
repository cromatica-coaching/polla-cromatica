/* AuthService maneja registro, inicio/cierre de sesión y usuario activo. */
window.AuthService = (() => {
  const { keys, read, write, uid } = window.StorageService;

  const getUsers = () => read(keys.users, []);
  const saveUsers = users => write(keys.users, users);
  const getCurrentUser = () => {
    const session = read(keys.session, null);
    if (!session) return null;
    return getUsers().find(user => user.id === session.userId) || null;
  };

  const register = ({ name, email, password, role = 'user' }) => {
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some(user => user.email === normalizedEmail)) {
      throw new Error('Ya existe un usuario registrado con ese email.');
    }
    const user = {
      id: uid('user'),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    write(keys.session, { userId: user.id, loggedAt: new Date().toISOString() });
    return user;
  };

  const login = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = getUsers().find(item => item.email === normalizedEmail && item.password === password);
    if (!user) throw new Error('Email o contraseña incorrectos.');
    write(keys.session, { userId: user.id, loggedAt: new Date().toISOString() });
    return user;
  };

  const logout = () => localStorage.removeItem(keys.session);

  return { getUsers, saveUsers, getCurrentUser, register, login, logout };
})();
