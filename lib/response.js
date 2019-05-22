module.exports = {
  success: (data, message) => {
    return { code: 20000, message, data, status: "SUCCESS" };
  },

  fail: (message) => {
    return { code: 50000, message, status: "ERROR" };
  }
};
