import { Injectable, signal } from '@angular/core';

export type Gender = 'male' | 'female' | 'other';
export type Status = 'idle' | 'connecting' | 'waiting' | 'chatting';

interface SignalData {
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface ServerMessage {
  type: 'waiting' | 'matched' | 'signal' | 'partner-left' | 'error';
  initiator?: boolean;
  partnerGender?: Gender;
  data?: SignalData;
  message?: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly status = signal<Status>('idle');
  readonly error = signal<string | null>(null);
  readonly partnerGender = signal<Gender | null>(null);
  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);
  readonly micEnabled = signal(true);
  readonly cameraEnabled = signal(true);

  private socket: WebSocket | null = null;
  private peer: RTCPeerConnection | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  async start(gender: Gender, over21: boolean): Promise<void> {
    this.error.set(null);
    this.status.set('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      this.localStream.set(stream);
      this.micEnabled.set(true);
      this.cameraEnabled.set(true);
    } catch {
      this.reset('Camera and microphone permissions are required to start video chat.');
      return;
    }

    this.connect(gender, over21);
  }

  next(): void {
    if (this.status() !== 'chatting') {
      return;
    }
    this.send({ type: 'next' });
    this.closePeer();
    this.partnerGender.set(null);
    this.status.set('waiting');
  }

  stop(): void {
    this.reset();
  }

  toggleMic(): void {
    const stream = this.localStream();
    if (!stream) {
      return;
    }
    const nextState = !this.micEnabled();
    stream.getAudioTracks().forEach((track) => (track.enabled = nextState));
    this.micEnabled.set(nextState);
  }

  toggleCamera(): void {
    const stream = this.localStream();
    if (!stream) {
      return;
    }
    const nextState = !this.cameraEnabled();
    stream.getVideoTracks().forEach((track) => (track.enabled = nextState));
    this.cameraEnabled.set(nextState);
  }

  private connect(gender: Gender, over21: boolean): void {
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${scheme}://${location.host}/ws`);
    this.socket = socket;

    socket.onopen = () => this.send({ type: 'join', gender, over21 });
    socket.onmessage = (event) => this.onMessage(JSON.parse(event.data as string) as ServerMessage);
    socket.onclose = () => {
      if (this.socket === socket) {
        this.reset('Connection to the server was lost. Please try again.');
      }
    };
  }

  private onMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'waiting':
      case 'partner-left':
        this.closePeer();
        this.partnerGender.set(null);
        this.status.set('waiting');
        break;

      case 'matched':
        this.partnerGender.set(msg.partnerGender ?? null);
        this.status.set('chatting');
        void this.startCall(msg.initiator === true);
        break;

      case 'signal':
        if (msg.data) {
          void this.onSignal(msg.data);
        }
        break;

      case 'error':
        if (this.status() === 'connecting') {
          this.reset(msg.message ?? 'Could not join.');
        } else {
          this.error.set(msg.message ?? 'Something went wrong.');
        }
        break;
    }
  }

  private send(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private async startCall(initiator: boolean): Promise<void> {
    this.closePeer();

    const peer = new RTCPeerConnection(RTC_CONFIG);
    this.peer = peer;

    const local = this.localStream();
    local?.getTracks().forEach((track) => peer.addTrack(track, local));

    peer.ontrack = (event) => {
      if (this.peer === peer) {
        this.remoteStream.set(event.streams[0] ?? null);
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({ type: 'signal', data: { candidate: event.candidate } });
      }
    };

    peer.onconnectionstatechange = () => {
      if (
        this.peer === peer &&
        (peer.connectionState === 'failed' || peer.connectionState === 'disconnected')
      ) {
        this.next();
      }
    };

    if (!initiator) {
      return;
    }

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (this.peer === peer) {
        this.send({ type: 'signal', data: { sdp: peer.localDescription } });
      }
    } catch (error) {
      if (this.peer === peer) {
        console.warn('Could not create offer', error);
      }
    }
  }

  private async onSignal(data: SignalData): Promise<void> {
    const peer = this.peer;
    if (!peer) {
      return;
    }

    try {
      if (data.sdp) {
        await peer.setRemoteDescription(data.sdp);
        for (const candidate of this.pendingCandidates.splice(0)) {
          await peer.addIceCandidate(candidate);
        }
        if (data.sdp.type === 'offer') {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          if (this.peer === peer) {
            this.send({ type: 'signal', data: { sdp: peer.localDescription } });
          }
        }
      } else if (data.candidate) {
        if (peer.remoteDescription) {
          await peer.addIceCandidate(data.candidate);
        } else {
          this.pendingCandidates.push(data.candidate);
        }
      }
    } catch (error) {
      if (this.peer === peer) {
        console.warn('Signaling problem', error);
      }
    }
  }

  private closePeer(): void {
    this.peer?.close();
    this.peer = null;
    this.pendingCandidates = [];
    this.remoteStream.set(null);
  }

  private reset(error: string | null = null): void {
    const socket = this.socket;
    this.socket = null;
    socket?.close();

    this.closePeer();
    this.localStream()
      ?.getTracks()
      .forEach((track) => track.stop());
    this.localStream.set(null);
    this.partnerGender.set(null);
    this.micEnabled.set(true);
    this.cameraEnabled.set(true);
    this.status.set('idle');
    this.error.set(error);
  }
}
