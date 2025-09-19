export type Contest = {
  id: string;
  title: string;
  prize: string;
  ticketCostPoints: number;
  closesAt: number; // epoch ms
  active: boolean;
  imageUrl?: string;
  totalTickets?: number;
  createdAt?: number;
};

export type ContestParticipant = {
  id: string; // `${contestId}_${uid}` ou docId aléatoire contenant { contestId, uid }
  contestId: string;
  uid: string;
  numTickets: number;
  updatedAt?: number;
};

export type ContestStats = {
  contest: Contest;
  userTickets: number;
  totalTickets: number;
  probability: number; // 0..1
};


