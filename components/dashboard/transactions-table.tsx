import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const transactions = [
  {
    id: 1,
    user: "Alex Chen",
    initials: "AC",
    itemType: "Laptop",
    weight: "2.4 kg",
    credits: 48,
    time: "2 min ago"
  },
  {
    id: 2,
    user: "Maria Santos",
    initials: "MS",
    itemType: "Smartphone",
    weight: "0.2 kg",
    credits: 12,
    time: "8 min ago"
  },
  {
    id: 3,
    user: "James Wilson",
    initials: "JW",
    itemType: "Monitor",
    weight: "5.1 kg",
    credits: 85,
    time: "15 min ago"
  },
  {
    id: 4,
    user: "Sarah Kim",
    initials: "SK",
    itemType: "Printer",
    weight: "8.3 kg",
    credits: 120,
    time: "32 min ago"
  },
  {
    id: 5,
    user: "David Brown",
    initials: "DB",
    itemType: "Tablet",
    weight: "0.5 kg",
    credits: 18,
    time: "45 min ago"
  },
]

export function TransactionsTable() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest e-waste deposits and credits</p>
        </div>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Item Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits Earned</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => (
              <tr 
                key={transaction.id} 
                className="hover:bg-secondary/20 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-border group-hover:border-primary/30 transition-colors">
                      <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
                        {transaction.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{transaction.user}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">{transaction.itemType}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">{transaction.weight}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                    +{transaction.credits}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-muted-foreground">{transaction.time}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
