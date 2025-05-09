
import { SupabaseClient } from '@supabase/supabase-js';

interface RealtimeOptions {
  channel?: string;
  sessionId: string | null;
  retryLimit?: number;
  retryDelay?: number;
  onMessage?: (payload: any) => void;
  onConnectionChange?: (status: boolean) => void;
}

export class RealtimeConnection {
  private supabase: SupabaseClient;
  private channel: any;
  private options: RealtimeOptions;
  private retryCount: number = 0;
  private retryTimer: number | null = null;
  private connected: boolean = false;

  constructor(supabase: SupabaseClient, options: RealtimeOptions) {
    this.supabase = supabase;
    this.options = {
      retryLimit: 10,
      retryDelay: 3000,
      ...options,
      channel: options.channel || `training-chat-${options.sessionId}-${Date.now()}`
    };
  }

  public connect(): void {
    if (!this.options.sessionId) return;
    console.log(`[RealtimeConnection] Connecting to channel: ${this.options.channel}`);

    // Clean up existing channel
    if (this.channel) {
      console.log('[RealtimeConnection] Removing existing channel');
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }

    try {
      this.channel = this.supabase
        .channel(this.options.channel!)
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'training_messages',
            filter: `session_id=eq.${this.options.sessionId}`
          },
          (payload) => {
            console.log('[RealtimeConnection] Received message:', payload);
            this.options.onMessage && this.options.onMessage(payload);
          })
        .subscribe((status: string) => this.handleSubscriptionStatus(status));

      console.log('[RealtimeConnection] Channel created:', this.options.channel);
    } catch (error) {
      console.error('[RealtimeConnection] Error creating channel:', error);
      this.handleConnectionError();
    }
  }

  private handleSubscriptionStatus(status: string): void {
    console.log(`[RealtimeConnection] Subscription status: ${status}`);
    
    if (status === 'SUBSCRIBED') {
      console.log('[RealtimeConnection] Successfully subscribed');
      this.retryCount = 0;
      if (!this.connected) {
        this.connected = true;
        this.options.onConnectionChange && this.options.onConnectionChange(true);
      }
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      console.error(`[RealtimeConnection] Connection ${status}`);
      if (this.connected) {
        this.connected = false;
        this.options.onConnectionChange && this.options.onConnectionChange(false);
      }
      this.handleConnectionError();
    }
  }

  private handleConnectionError(): void {
    if (this.retryCount < (this.options.retryLimit || 10)) {
      this.retryCount++;
      console.log(`[RealtimeConnection] Attempting reconnection ${this.retryCount}/${this.options.retryLimit}`);
      
      // Clear any existing retry timer
      if (this.retryTimer) {
        window.clearTimeout(this.retryTimer);
      }
      
      // Set a new retry timer
      this.retryTimer = window.setTimeout(() => {
        this.connect();
      }, this.options.retryDelay);
    } else {
      console.error('[RealtimeConnection] Exceeded retry limit, giving up');
    }
  }

  public disconnect(): void {
    if (this.channel) {
      console.log('[RealtimeConnection] Disconnecting channel');
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.connected = false;
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export const createRealtimeConnection = (
  supabase: SupabaseClient,
  options: RealtimeOptions
): RealtimeConnection => {
  return new RealtimeConnection(supabase, options);
};
