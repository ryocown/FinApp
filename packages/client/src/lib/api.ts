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
