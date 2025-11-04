import { Users, CheckCircle2, Clock, XCircle, Ticket } from 'lucide-react';

interface RsvpStats {
  total: number;
  confirmed: number;
  rejected: number;
  pending: number;
  totalTickets: number;
  confirmedTickets: number;
  pendingTickets: number;
  rejectedTickets: number;
}

interface RsvpStatisticsProps {
  stats: RsvpStats;
}

export function RsvpStatistics({ stats }: RsvpStatisticsProps) {
  // Calculate percentages
  const confirmedPercentage = stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0;
  const pendingPercentage = stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0;
  const rejectedPercentage = stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0;
  const confirmedTicketsPercentage = stats.totalTickets > 0 ? Math.round((stats.confirmedTickets / stats.totalTickets) * 100) : 0;
  const pendingTicketsPercentage = stats.totalTickets > 0 ? Math.round((stats.pendingTickets / stats.totalTickets) * 100) : 0;
  const rejectedTicketsPercentage = stats.totalTickets > 0 ? Math.round((stats.rejectedTickets / stats.totalTickets) * 100) : 0;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Invitados */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Total Invitados</p>
              <div className="w-10 h-10 rounded-full bg-[#007aff]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#007aff]" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-foreground">{stats.total}</p>
          </div>
        </div>

        {/* 2. Confirmados (with percentage) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Confirmados</p>
              <div className="w-10 h-10 rounded-full bg-[#34c759]/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[#34c759]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-foreground">
                {stats.confirmed}/<span className="text-muted-foreground text-xl!">{stats.total}</span>
              </p>
              <span className="text-sm font-medium text-[#34c759]">{confirmedPercentage}%</span>
            </div>
          </div>
        </div>

        {/* 3. Pendientes (with percentage) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <div className="w-10 h-10 rounded-full bg-[#ff9500]/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#ff9500]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-foreground">
                {stats.pending}/<span className="text-muted-foreground text-xl!">{stats.total}</span>
              </p>
              <span className="text-sm font-medium text-[#ff9500]">{pendingPercentage}%</span>
            </div>
          </div>
        </div>

        {/* 4. Rechazados (with percentage) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Rechazados</p>
              <div className="w-10 h-10 rounded-full bg-[#ff3b30]/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-[#ff3b30]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-foreground">
                {stats.rejected}/<span className="text-muted-foreground text-xl!">{stats.total}</span>
              </p>
              <span className="text-sm font-medium text-[#ff3b30]">{rejectedPercentage}%</span>
            </div>
          </div>
        </div>

        {/* 5. Total Boletos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Total Boletos</p>
              <div className="w-10 h-10 rounded-full bg-[#5856d6]/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-[#5856d6]" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-foreground">{stats.totalTickets}</p>
          </div>
        </div>

        {/* 6. Boletos Confirmados (with percentage) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Boletos Confirmados</p>
              <div className="w-10 h-10 rounded-full bg-[#34c759]/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-[#34c759]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-foreground">
                {stats.confirmedTickets}/<span className="text-muted-foreground text-xl!">{stats.totalTickets}</span>
              </p>
              <span className="text-sm font-medium text-[#34c759]">{confirmedTicketsPercentage}%</span>
            </div>
          </div>
        </div>

        {/* 7. Boletos Pendientes (with percentage) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Boletos Pendientes</p>
              <div className="w-10 h-10 rounded-full bg-[#ff9500]/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-[#ff9500]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-foreground">
                {stats.pendingTickets}/<span className="text-muted-foreground text-xl!">{stats.totalTickets}</span>
              </p>
              <span className="text-sm font-medium text-[#ff9500]">{pendingTicketsPercentage}%</span>
            </div>
          </div>
        </div>

        {/* 8. Boletos Pendientes/Rechazados (with percentage) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Boletos Pendientes/Rechazados</p>
              <div className="w-10 h-10 rounded-full bg-[#ff3b30]/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-[#ff3b30]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-foreground">
                {stats.rejectedTickets}/<span className="text-muted-foreground text-xl!">{stats.totalTickets}</span>
              </p>
              <span className="text-sm font-medium text-[#ff3b30]">{rejectedTicketsPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
