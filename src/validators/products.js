const editableFields = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"];

function validateProductInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { data, errors: ["Request body must be a JSON object"] };
  }

  for (const field of editableFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];
    if (["name", "sku", "category", "supplier"].includes(field)) {
      if (typeof value !== "string" || !value.trim()) {
        errors.push(`${field} must be a non-empty string`);
      } else if (value.trim().length > (field === "name" || field === "supplier" ? 120 : 60)) {
        errors.push(`${field} is too long`);
      } else {
        data[field] = value.trim();
      }
    } else {
      const number = Number(value);
      const mustBeInteger = field === "quantity" || field === "reorderLevel";
      if (!Number.isFinite(number) || number < 0 || (mustBeInteger && !Number.isInteger(number))) {
        errors.push(`${field} must be a valid ${mustBeInteger ? "non-negative integer" : "non-negative number"}`);
      } else {
        data[field] = number;
      }
    }
  }

  if (!partial) {
    for (const field of editableFields) {
      if (!Object.prototype.hasOwnProperty.call(data, field)) errors.push(`${field} is required`);
    }
  }
  if (Object.keys(data).length === 0 && partial) errors.push("Provide at least one editable field");
  return { data, errors };
}

module.exports = { validateProductInput, editableFields };
