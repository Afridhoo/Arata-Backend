export const filterValue = (value, filteredValue) => {
  const correctObj = {};
  Object.keys(value).forEach(
    (el) => filteredValue.includes(el) && (correctObj[el] = value[el]),
  );

  return correctObj;
};
