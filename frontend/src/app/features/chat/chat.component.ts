import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
})
export class ChatComponent {
  inputText = '';
  messages = signal<any[]>([]);
  selectedFiles = signal<File[]>([]);
  isLoading = signal(false);
  messageIdCounter = 0;
  showUrlInput = signal(false);
  urlInput = '';

  readonly ACCEPTED_MIME_TYPES = [
    'video/mp4', 'image/png', 'image/jpeg', 'image/webp', 'video/webm',
  ];

  constructor(private router: Router) {}

  private generateMessageId(): string {
    return `msg-${Date.now()}-${this.messageIdCounter++}`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);

      // Filtrer uniquement les fichiers avec les bons MIME types
      const validFiles = newFiles.filter((file) => {
        if (!this.ACCEPTED_MIME_TYPES.includes(file.type)) {
          console.warn(`File ${file.name} has invalid type: ${file.type}`);
          alert(
            `Le fichier "${file.name}" n'est pas un format accepté.\nFormats acceptés: MP4, WebM, PNG, JPEG, WebP`,
          );
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        this.selectedFiles.update((files) => [...files, ...validFiles]);
      }

      input.value = ''; // Reset input
    }
  }

  removeFile(fileToRemove: File) {
    this.selectedFiles.update((files) => files.filter((file) => file !== fileToRemove));
  }

  async onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file && this.ACCEPTED_MIME_TYPES.includes(file.type)) {
          this.selectedFiles.update((files) => [...files, file]);
        } else if (file) {
          alert(
            `Le fichier "${file.name}" n'est pas un format accepté.\nFormats acceptés: MP4, WebM, PNG, JPEG, WebP`,
          );
        }
      }
    }
  }

  toggleUrlInput() {
    this.showUrlInput.update((show) => !show);
    this.urlInput = '';
  }

  async addFromUrl() {
    if (!this.urlInput.trim()) return;

    try {
      const response = await fetch(this.urlInput);
      const contentType = response.headers.get('content-type');

      if (!contentType || !this.ACCEPTED_MIME_TYPES.includes(contentType)) {
        alert(
          `L'URL ne pointe pas vers un format accepté.\nFormats acceptés: MP4, WebM, PNG, JPEG, WebP`,
        );
        return;
      }

      const blob = await response.blob();
      const filename = this.urlInput.split('/').pop() || 'file';
      const file = new File([blob], filename, { type: contentType });

      this.selectedFiles.update((files) => [...files, file]);
      this.showUrlInput.set(false);
      this.urlInput = '';
    } catch (error) {
      console.error('Error fetching URL:', error);
      alert("Erreur lors du chargement du fichier depuis l'URL");
    }
  }

  async handleSubmit(event?: KeyboardEvent) {
    if (event) {
      event.preventDefault();
    }

    if (!this.inputText.trim() && this.selectedFiles().length === 0) return;

    const userMessage = this.inputText;
    const files = this.selectedFiles();

    // Add user message
    const userMessageObj = {
      id: this.generateMessageId(),
      role: 'user',
      content: userMessage,
    };
    this.messages.update((msgs) => [...msgs, userMessageObj]);

    // Clear inputs
    this.inputText = '';
    this.selectedFiles.set([]);
    this.isLoading.set(true);

    // Add assistant message (streaming)
    const assistantMessageId = this.generateMessageId();
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      steps: [] as string[],
      isStreaming: true,
    };
    this.messages.update((msgs) => [...msgs, assistantMessage]);

    try {
      // Use FormData for SSE streaming
      const formData = new FormData();
      formData.append('message', userMessage);
      files.forEach((file) => formData.append('files', file));

      const response = await fetch(`${environment.apiUrl}/chat/message`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
           if (line.startsWith('data: ')) {
             const data = line.substring(6).trim();
             if (!data) continue;

             try {
               const event = JSON.parse(data);

              this.messages.update((msgs) => {
                const msgIndex = msgs.findIndex((m) => m.id === assistantMessageId);
                if (msgIndex === -1) return msgs;

                const updatedMsgs = [...msgs];
                const msg = { ...updatedMsgs[msgIndex] };

                if (event.type === 'step') {
                  msg.steps = [...msg.steps, event.data];
                } else if (event.type === 'token') {
                  msg.content += event.data;
                }

                updatedMsgs[msgIndex] = msg;
                return updatedMsgs;
               });
            } catch (e) {
              console.warn('Failed to parse SSE event:', data);
            }
           }
        }
      }

      // Mark as done streaming
      this.messages.update((msgs) => {
        const msgIndex = msgs.findIndex((m) => m.id === assistantMessageId);
        if (msgIndex === -1) return msgs;
        const updatedMsgs = [...msgs];
        updatedMsgs[msgIndex] = { ...updatedMsgs[msgIndex], isStreaming: false };
        return updatedMsgs;
      });
    } catch (err) {
      console.error('Chat error:', err);
      this.messages.update((msgs) => {
        const msgIndex = msgs.findIndex((m) => m.id === assistantMessageId);
        if (msgIndex === -1) return msgs;
        const updatedMsgs = [...msgs];
        updatedMsgs[msgIndex] = {
          ...updatedMsgs[msgIndex],
          content: 'Error: Failed to get response',
          isStreaming: false,
        };
        return updatedMsgs;
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  // TODO: Remove this method later
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
