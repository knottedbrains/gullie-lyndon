"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, DollarSign, FileText, Loader2 } from "lucide-react";
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

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading invoices...
            </div>
          </CardContent>
        </Card>
      ) : invoices && invoices.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        #{invoice.invoiceNumber}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {invoice.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${invoice.subtotal}</TableCell>
                    <TableCell className="text-right">${invoice.gullieFee}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${invoice.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && invoices && invoices.length === 0 && searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No invoices found for this move.
          </CardContent>
        </Card>
      )}

      {!isLoading && !searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Enter a move ID to search for invoices.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

