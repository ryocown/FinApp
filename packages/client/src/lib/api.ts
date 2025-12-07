const API_BASE_URL = 'http://localhost:3001/api';

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/transactions/users/${userId}/transactions/${transactionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || `Server error: ${response.status}`);
    } catch (e) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }
}

export async function createTransaction(userId: string, transaction: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/transactions/users/${userId}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || `Server error: ${response.status}`);
    } catch (e) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }
  return response.json();
}

export async function searchInstruments(query: string): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/instruments/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  return response.json();
}

export async function createTransfer(userId: string, transferData: { source: any, destination: any }): Promise<any> {
  const { source, destination } = transferData;

  // Create both transactions
  // We run them in parallel for speed, though sequential might be safer for error handling.
  // If one fails, we have a partial state. 
  // Ideally we'd use a batch endpoint, but for now parallel is fine.

  const [sourceRes, destRes] = await Promise.all([
    createTransaction(userId, source),
    createTransaction(userId, destination)
  ]);

  return { source: sourceRes, destination: destRes };
}

