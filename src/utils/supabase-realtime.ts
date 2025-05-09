
import { SupabaseClient } from '@supabase/supabase-js';

interface RealtimeOptions {
  channel?: string;
  sessionId: string | null;
  retryLimit?: number;
  retryDelay?: number;
  onMessage?: (payload: any) => void;
  onConnectionChange?: (status: boolean) => void;
  debugMode?: boolean;
}

export class RealtimeConnection {
  private supabase: SupabaseClient;
  private channel: any;
  private options: RealtimeOptions;
  private retryCount: number = 0;
  private retryTimer: number | null = null;
  private connected: boolean = false;
  private messageIds: Set<string> = new Set();

  constructor(supabase: SupabaseClient, options: RealtimeOptions) {
    this.supabase = supabase;
    this.options = {
      retryLimit: 15,
      retryDelay: 2000,
      debugMode: true,
      ...options,
      channel: options.channel || `training-chat-${options.sessionId}-${Date.now()}`
    };
    this.log('Initializing RealtimeConnection');
  }

  private log(message: string, data?: any): void {
    if (this.options.debugMode) {
      console.log(`[RealtimeConnection] ${message}`, data || '');
    }
  }

  public connect(): void {
    if (!this.options.sessionId) {
      this.log('No session ID provided, cannot connect');
      return;
    }
    
    this.log(`Connecting to channel: ${this.options.channel}`);

    // Clean up existing channel
    if (this.channel) {
      this.log('Removing existing channel');
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
            this.log('Received real-time message:', payload);
            
            // Check if we've already processed this message
            if (payload.new && payload.new.id && !this.messageIds.has(payload.new.id)) {
              this.messageIds.add(payload.new.id);
              
              // Add a small delay to ensure consistent message processing
              setTimeout(() => {
                this.options.onMessage && this.options.onMessage(payload);
              }, 100);
            } else {
              this.log('Duplicate message detected, ignoring', payload.new?.id);
            }
          })
        .subscribe((status: string) => this.handleSubscriptionStatus(status));

      this.log('Channel created:', this.options.channel);
    } catch (error) {
      this.log('Error creating channel:', error);
      this.handleConnectionError();
    }
  }

  private handleSubscriptionStatus(status: string): void {
    this.log(`Subscription status: ${status}`);
    
    if (status === 'SUBSCRIBED') {
      this.log('Successfully subscribed');
      this.retryCount = 0;
      if (!this.connected) {
        this.connected = true;
        this.options.onConnectionChange && this.options.onConnectionChange(true);
      }
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      this.log(`Connection ${status}`, 'error');
      if (this.connected) {
        this.connected = false;
        this.options.onConnectionChange && this.options.onConnectionChange(false);
      }
      this.handleConnectionError();
    }
  }

  private handleConnectionError(): void {
    if (this.retryCount < (this.options.retryLimit || 15)) {
      this.retryCount++;
      this.log(`Attempting reconnection ${this.retryCount}/${this.options.retryLimit}`);
      
      // Clear any existing retry timer
      if (this.retryTimer) {
        window.clearTimeout(this.retryTimer);
      }
      
      // Set a new retry timer with exponential backoff
      const delay = Math.min(this.options.retryDelay! * Math.pow(1.5, this.retryCount - 1), 20000);
      this.log(`Retry in ${delay}ms`);
      
      this.retryTimer = window.setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.log('Exceeded retry limit, giving up', 'error');
      this.options.onConnectionChange && this.options.onConnectionChange(false);
    }
  }

  public forceTriggerReconnect(): void {
    this.log('Force reconnection triggered');
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.connected = false;
    this.connect();
  }

  public disconnect(): void {
    this.log('Disconnecting channel');
    if (this.channel) {
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
  
  public clearMessageCache(): void {
    this.messageIds.clear();
  }
}

export const createRealtimeConnection = (
  supabase: SupabaseClient,
  options: RealtimeOptions
): RealtimeConnection => {
  return new RealtimeConnection(supabase, options);
};
