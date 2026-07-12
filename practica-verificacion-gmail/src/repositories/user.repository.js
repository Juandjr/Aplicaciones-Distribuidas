const users = new Map();

function findByEmail(email) {
  return users.get(email) || null;
}

function save(user) {
  users.set(user.email, user);
  return user;
}

function updateByEmail(email, changes) {
  const currentUser = findByEmail(email);

  if (!currentUser) {
    return null;
  }

  const updatedUser = {
    ...currentUser,
    ...changes,
    updatedAt: new Date().toISOString()
  };

  users.set(email, updatedUser);
  return updatedUser;
}

function removeByEmail(email) {
  return users.delete(email);
}

module.exports = {
  findByEmail,
  save,
  updateByEmail,
  removeByEmail
};