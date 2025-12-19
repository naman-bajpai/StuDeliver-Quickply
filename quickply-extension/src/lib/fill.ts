import { UserData } from './storage';

export async function fillFields(userData: UserData): Promise<void> {
  const inputs = document.querySelectorAll('input, textarea, select');
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Skip hidden fields, submit buttons, etc.
    if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
      return;
    }

    const fieldName = element.name?.toLowerCase() || '';
    const fieldId = element.id?.toLowerCase() || '';
    const placeholder = (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
      ? (element.placeholder?.toLowerCase() || '')
      : '';
    const label = getFieldLabel(element)?.toLowerCase() || '';

    // Try to match field with user data
    let value: string | undefined;

    // Check by name
    if (fieldName) {
      value = matchField(fieldName, userData);
    }

    // Check by id if name didn't match
    if (!value && fieldId) {
      value = matchField(fieldId, userData);
    }

    // Check by placeholder if still no match
    if (!value && placeholder) {
      value = matchField(placeholder, userData);
    }

    // Check by label if still no match
    if (!value && label) {
      value = matchField(label, userData);
    }

    // Fill the field if we found a match
    if (value) {
      if (element instanceof HTMLSelectElement) {
        // For select elements, try to find matching option
        const option = Array.from(element.options).find(
          (opt) => opt.value.toLowerCase() === value.toLowerCase() || 
                   opt.text.toLowerCase() === value.toLowerCase()
        );
        if (option) {
          element.value = option.value;
        }
      } else {
        element.value = value;
        
        // Trigger input events to ensure form validation works
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
}

function getFieldLabel(element: HTMLElement): string | null {
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.textContent?.trim() || null;
    }
  }
  
  const parentLabel = element.closest('label');
  if (parentLabel) {
    return parentLabel.textContent?.trim() || null;
  }
  
  return null;
}

function matchField(fieldIdentifier: string, userData: UserData): string | undefined {
  const identifier = fieldIdentifier.toLowerCase();
  
  // Common field mappings
  const mappings: { [key: string]: keyof UserData } = {
    'firstname': 'firstName',
    'first_name': 'firstName',
    'fname': 'firstName',
    'lastname': 'lastName',
    'last_name': 'lastName',
    'lname': 'lastName',
    'email': 'email',
    'e-mail': 'email',
    'phone': 'phone',
    'telephone': 'phone',
    'mobile': 'phone',
    'address': 'address',
    'street': 'address',
    'city': 'city',
    'state': 'state',
    'zip': 'zipCode',
    'zipcode': 'zipCode',
    'zip_code': 'zipCode',
    'postal': 'zipCode',
    'country': 'country',
    'resume': 'resume',
    'cv': 'resume',
    'coverletter': 'coverLetter',
    'cover_letter': 'coverLetter',
  };

  // Check direct mappings
  for (const [key, dataKey] of Object.entries(mappings)) {
    if (identifier.includes(key)) {
      return userData[dataKey] as string | undefined;
    }
  }

  // Check if identifier directly matches a userData key
  const normalizedKey = identifier.replace(/[^a-z0-9]/g, '');
  for (const [key, value] of Object.entries(userData)) {
    const normalizedUserKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedKey.includes(normalizedUserKey) || normalizedUserKey.includes(normalizedKey)) {
      return value as string | undefined;
    }
  }

  return undefined;
}

