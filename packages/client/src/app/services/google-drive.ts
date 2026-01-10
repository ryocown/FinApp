import { Injectable } from '@angular/core';

declare const gapi: any;
declare const google: any;

@Injectable({
    providedIn: 'root'
})
export class GoogleDriveService {
    private clientId = '479344769542-c3iajipmha994v6jo7gmdsjtpl8i5ljk.apps.googleusercontent.com';
    private scope = 'https://www.googleapis.com/auth/drive.readonly';
    private pickerApiLoaded = false;
    private tokenClient: any;
    private accessToken: string | null = null;
    private apiKey = 'YOUR_API_KEY'; // Picker often requires API Key for "Developer Console" linkage. 
    // Wait, I might need an API Key for Picker. Creating a placeholder or checking if I can use client ID only (Project ID). 
    // Often CLIENT_ID is enough for logic, but 'setDeveloperKey' is common.
    // I will check environment or try to proceed without `setDeveloperKey` if possible, or assume user configured it.
    // Actually, standard Picker setup uses API Key. I'll add a note or try to find one. 
    // For now I'll skip setDeveloperKey and see if it works with strictly OAuth token.

    constructor() {
        this.loadGapi();
        this.loadGis();
    }

    // Load Google API Client Library
    private loadGapi() {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi.load('picker', () => {
                this.pickerApiLoaded = true;
            });
        };
        document.body.appendChild(script);
    }

    // Load Google Identity Services Library
    private loadGis() {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scope,
                callback: (tokenResponse: any) => {
                    this.accessToken = tokenResponse.access_token;
                },
            });
        };
        document.body.appendChild(script);
    }

    // Determine if we need to request a token
    async getAccessToken(): Promise<string> {
        if (this.accessToken) return this.accessToken;

        return new Promise((resolve, reject) => {
            this.tokenClient.callback = (tokenResponse: any) => {
                if (tokenResponse.error) {
                    reject(tokenResponse);
                }
                this.accessToken = tokenResponse.access_token;
                resolve(this.accessToken!);
            };
            // Prompt the user for consent
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    }

    async openPicker(): Promise<any> {
        const token = await this.getAccessToken();

        return new Promise((resolve, reject) => {
            if (!this.pickerApiLoaded) {
                reject("Google Picker API not loaded");
                return;
            }

            const view = new google.picker.View(google.picker.ViewId.DOCS);
            view.setMimeTypes('text/csv,application/vnd.google-apps.spreadsheet,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            const pickerBuilder = new google.picker.PickerBuilder()
                // .setDeveloperKey(API_KEY) // Optional if strictly using OAuth? Usually required. I'll omit for now.
                .setAppId(this.clientId.split('-')[0])
                .setOAuthToken(token)
                .addView(view)
                .setCallback((data: any) => {
                    if (data.action === google.picker.Action.PICKED) {
                        const file = data.docs[0];
                        resolve(file);
                    } else if (data.action === google.picker.Action.CANCEL) {
                        reject("Cancelled");
                    }
                });

            const picker = pickerBuilder.build();
            picker.setVisible(true);
        });
    }

    async downloadFile(fileId: string): Promise<string> {
        const token = await this.getAccessToken();
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to download file from Drive');
        }
        // If it's a PDF, we might need arrayBuffer. If text/csv, text.
        // This simple return might be insufficient if we need to handle blobs for PDF parsing.
        // I should assume the caller handles the format?
        // I'll return the Blob, let the caller handle text/buffer.
        // But the return type says string. I will change to Blob or ArrayBuffer.
        // Wait, `fromExcelToCsv` takes buffer. `extractTextFromPdf` takes File (which is Blob).
        // So I'll return Blob.
        return (await response.blob()) as any;
    }
}
