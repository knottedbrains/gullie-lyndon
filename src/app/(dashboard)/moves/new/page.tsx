"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewMovePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeId: "",
    employerId: "",
    policyId: "",
    originCity: "",
    destinationCity: "",
    officeLocation: "",
    programType: "",
    benefitAmount: "",
    moveDate: "",
  });

  const { data: employees, isLoading: employeesLoading } = trpc.employees.list.useQuery({
    limit: 100,
  });

  const { data: employers, isLoading: employersLoading } = trpc.employers.list.useQuery({
    limit: 100,
  });

  const createMove = trpc.moves.create.useMutation({
    onSuccess: (move) => {
      router.push(`/moves/${move.id}`);
    },
    onError: (error) => {
      console.error("Failed to create move:", error);
      alert(`Failed to create move: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.employerId || !formData.originCity || 
        !formData.destinationCity || !formData.officeLocation) {
      alert("Please fill in all required fields");
      return;
    }

    createMove.mutate({
      employeeId: formData.employeeId,
      employerId: formData.employerId,
      policyId: formData.policyId || undefined,
      originCity: formData.originCity,
      destinationCity: formData.destinationCity,
      officeLocation: formData.officeLocation,
      programType: formData.programType || undefined,
      benefitAmount: formData.benefitAmount || undefined,
      moveDate: formData.moveDate ? new Date(formData.moveDate) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/moves">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Move</h1>
          <p className="text-muted-foreground">Initiate a new relocation move</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Move Details</CardTitle>
          <CardDescription>
            Fill in the information to create a new relocation move
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  disabled={employeesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employerId">Employer *</Label>
                <Select
                  value={formData.employerId}
                  onValueChange={(value) => setFormData({ ...formData, employerId: value })}
                  disabled={employersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employer" />
                  </SelectTrigger>
                  <SelectContent>
                    {employers?.map((employer) => (
                      <SelectItem key={employer.id} value={employer.id}>
                        {employer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="originCity">Origin City *</Label>
                <Input
                  id="originCity"
                  value={formData.originCity}
                  onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
                  placeholder="e.g., San Francisco"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationCity">Destination City *</Label>
                <Input
                  id="destinationCity"
                  value={formData.destinationCity}
                  onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                  placeholder="e.g., New York"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeLocation">Office Location *</Label>
                <Input
                  id="officeLocation"
                  value={formData.officeLocation}
                  onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  placeholder="e.g., New York Office"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveDate">Move Date</Label>
                <Input
                  id="moveDate"
                  type="date"
                  value={formData.moveDate}
                  onChange={(e) => setFormData({ ...formData, moveDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="programType">Program Type</Label>
                <Input
                  id="programType"
                  value={formData.programType}
                  onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                  placeholder="e.g., Executive Relocation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefitAmount">Benefit Amount</Label>
                <Input
                  id="benefitAmount"
                  type="number"
                  value={formData.benefitAmount}
                  onChange={(e) => setFormData({ ...formData, benefitAmount: e.target.value })}
                  placeholder="e.g., 50000"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMove.isLoading || employeesLoading || employersLoading}
              >
                {createMove.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Move
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMove.isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

