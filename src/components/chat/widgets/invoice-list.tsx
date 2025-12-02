import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  gullieFee: string;
  total: string;
  status?: string;
  paymentStatus?: string;
  createdAt?: string | Date;
}

export interface InvoiceListProps {
  invoices: Invoice[];
}

export function InvoiceListWidget({ invoices }: InvoiceListProps) {
  if (!invoices || invoices.length === 0) {
    return (
      <Card className="w-full max-w-md border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No invoices found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 shadow-md">
      <div className="h-2 bg-green-500 w-full" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Invoices</CardTitle>
          <Badge variant="outline">{invoices.length} found</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {invoices.map((invoice) => (
          <div 
            key={invoice.id} 
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  #{invoice.invoiceNumber}
                </p>
                {invoice.createdAt && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge 
                className={
                  invoice.paymentStatus === "paid" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                  invoice.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                  invoice.paymentStatus === "disputed" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                  "bg-gray-100 text-gray-700 hover:bg-gray-100"
                }
                variant="secondary"
              >
                {invoice.paymentStatus || invoice.status || "Unknown"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">Total Amount</div>
              <div className="font-bold flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                {invoice.total}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

