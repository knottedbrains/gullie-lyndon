"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, FileText } from "lucide-react";
import { useState } from "react";

export default function FinancialPage() {
  const [searchMoveId, setSearchMoveId] = useState("");
  const { data: invoices, isLoading } = trpc.financial.invoices.list.useQuery(
    {
      moveId: searchMoveId || undefined,
    },
    {
      enabled: !!searchMoveId,
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial</h1>
        <p className="text-muted-foreground">
          Manage invoices and financial records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Invoices</CardTitle>
          <CardDescription>
            Enter a move ID to view invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter move ID..."
                value={searchMoveId}
                onChange={(e) => setSearchMoveId(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
      )}

      {invoices && invoices.length > 0 && (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoice #{invoice.invoiceNumber}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(invoice.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{invoice.paymentStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-semibold">${invoice.subtotal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gullie Fee</p>
                    <p className="text-lg font-semibold">${invoice.gullieFee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {invoice.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {invoices && invoices.length === 0 && searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No invoices found for this move.
          </CardContent>
        </Card>
      )}

      {!searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Enter a move ID to search for invoices.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

