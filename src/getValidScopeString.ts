/**
 * Validate the scope argument string to be sure
 * there are no errors.
 * @param fieldConditionString - scope string to be checked
 */
export function getValidScopeString(fieldConditionString: string): string[] {
  const splitString = fieldConditionString.split('|');
  if (splitString.length < 3) {
    throw Error(`Incorrect Parts supplied for scope: ${fieldConditionString}`);
  }
  const field = splitString[0].trim();
  const operation = splitString[1].trim();
  const value = splitString[2].trim();

  if (field === '' || operation === '' || value === '') {
    throw Error(`Incorrect Parts supplied for scope: ${fieldConditionString}`);
  }
  return splitString;
}
