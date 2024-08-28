module.exports.asyncForEach = async function (array, callBack) {
  for (var i = 0; i < array.length; i += 1) {
      await callBack(array[i], i, array); //eslint-disable-line
  }
};
