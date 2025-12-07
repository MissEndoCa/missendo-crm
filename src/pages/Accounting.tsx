import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, DollarSign, TrendingUp, TrendingDown, FileText, Plus, ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED'];

interface FinancialRecord {
  id: string;
  patient_id: string;
  total_amount: number;
  treatment_cost: number;
  transfer_cost: number;
  hotel_cost: number;
  companion_cost: number;
  total_discount: number;
  currency: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
}

interface IncomeExpense {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
  reference_type: string | null;
  notes: string | null;
}

const INCOME_CATEGORIES = [
  'Treatment Payment',
  'Service Fee',
  'Consultation Fee',
  'Product Sales',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Staff Salary',
  'Medical Supplies',
  'Equipment Purchase',
  'Rent & Utilities',
  'Marketing',
  'Transportation',
  'Administrative',
  'Other Expense'
];

const REFERENCE_TYPES = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'patient', label: 'Patient' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'other', label: 'Other' }
];

export default function Accounting() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeExpense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    reference_type: '',
    notes: ''
  });
  
  const [incomeForm, setIncomeForm] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    reference_type: '',
    notes: ''
  });
  
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    reference_type: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchRecords();
      fetchIncomeExpenses();
    }
  }, [profile?.organization_id]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          patient:patients (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching financial records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch financial records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('income_expenses')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomeExpenses((data as IncomeExpense[]) || []);
    } catch (error) {
      console.error('Error fetching income/expenses:', error);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('income_expenses').insert([{
        organization_id: profile?.organization_id,
        type: 'income',
        category: incomeForm.category,
        amount: parseFloat(incomeForm.amount),
        currency: incomeForm.currency,
        description: incomeForm.description || null,
        reference_type: incomeForm.reference_type || null,
        notes: incomeForm.notes || null,
        created_by: profile?.id
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Income added successfully',
      });

      setIsIncomeDialogOpen(false);
      setIncomeForm({
        category: '',
        amount: '',
        currency: 'USD',
        description: '',
        reference_type: '',
        notes: ''
      });
      fetchIncomeExpenses();
    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        title: 'Error',
        description: 'Failed to add income',
        variant: 'destructive',
      });
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('income_expenses').insert([{
        organization_id: profile?.organization_id,
        type: 'expense',
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        currency: expenseForm.currency,
        description: expenseForm.description || null,
        reference_type: expenseForm.reference_type || null,
        notes: expenseForm.notes || null,
        created_by: profile?.id
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });

      setIsExpenseDialogOpen(false);
      setExpenseForm({
        category: '',
        amount: '',
        currency: 'USD',
        description: '',
        reference_type: '',
        notes: ''
      });
      fetchIncomeExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (item: IncomeExpense) => {
    setEditingItem(item);
    setEditForm({
      category: item.category,
      amount: String(item.amount),
      currency: item.currency,
      description: item.description || '',
      reference_type: item.reference_type || '',
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('income_expenses')
        .update({
          category: editForm.category,
          amount: parseFloat(editForm.amount),
          currency: editForm.currency,
          description: editForm.description || null,
          reference_type: editForm.reference_type || null,
          notes: editForm.notes || null
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchIncomeExpenses();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItemId) return;

    try {
      const { error } = await supabase
        .from('income_expenses')
        .delete()
        .eq('id', deletingItemId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });

      setDeleteDialogOpen(false);
      setDeletingItemId(null);
      fetchIncomeExpenses();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      });
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalIncome = incomeExpenses
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);
  
  const totalExpense = incomeExpenses
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const netProfit = totalIncome - totalExpense;

  const totalRevenue = filteredRecords.reduce((sum, record) => sum + Number(record.total_amount), 0);
  const totalPaid = filteredRecords
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, record) => sum + Number(record.total_amount), 0);
  const totalPending = filteredRecords
    .filter(r => r.payment_status === 'pending')
    .reduce((sum, record) => sum + Number(record.total_amount), 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
            <p className="text-muted-foreground">Manage financial records and transactions</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Income</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddIncome} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="income-category">Category *</Label>
                    <Select value={incomeForm.category} onValueChange={(value) => setIncomeForm({...incomeForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="income-amount">Amount *</Label>
                      <Input
                        id="income-amount"
                        type="number"
                        step="0.01"
                        value={incomeForm.amount}
                        onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="income-currency">Currency</Label>
                      <Select value={incomeForm.currency} onValueChange={(value) => setIncomeForm({...incomeForm, currency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(curr => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-description">Description</Label>
                    <Input
                      id="income-description"
                      value={incomeForm.description}
                      onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-reference">Reference Type</Label>
                    <Select value={incomeForm.reference_type} onValueChange={(value) => setIncomeForm({...incomeForm, reference_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reference" />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERENCE_TYPES.map(ref => (
                          <SelectItem key={ref.value} value={ref.value}>{ref.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-notes">Notes</Label>
                    <Textarea
                      id="income-notes"
                      value={incomeForm.notes}
                      onChange={(e) => setIncomeForm({...incomeForm, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsIncomeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Income</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-category">Category *</Label>
                    <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({...expenseForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense-amount">Amount *</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-currency">Currency</Label>
                      <Select value={expenseForm.currency} onValueChange={(value) => setExpenseForm({...expenseForm, currency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(curr => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-description">Description</Label>
                    <Input
                      id="expense-description"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-reference">Reference Type</Label>
                    <Select value={expenseForm.reference_type} onValueChange={(value) => setExpenseForm({...expenseForm, reference_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reference" />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERENCE_TYPES.map(ref => (
                          <SelectItem key={ref.value} value={ref.value}>{ref.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-notes">Notes</Label>
                    <Textarea
                      id="expense-notes"
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="destructive">Add Expense</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {incomeExpenses.filter(i => i.type === 'income').length} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalExpense.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {incomeExpenses.filter(i => i.type === 'expense').length} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(netProfit).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patient Payments</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredRecords.filter(r => r.payment_status === 'paid').length} paid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Income/Expense Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Income & Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeExpenses.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No income or expenses recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeExpenses.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.type === 'income' ? 'default' : 'destructive'}>
                            {item.type === 'income' ? (
                              <><ArrowUpCircle className="w-3 h-3 mr-1" /> Income</>
                            ) : (
                              <><ArrowDownCircle className="w-3 h-3 mr-1" /> Expense</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell className="capitalize">{item.reference_type || '-'}</TableCell>
                        <TableCell className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.type === 'income' ? '+' : '-'}{item.currency} {Number(item.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Financial Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No financial records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Transfer</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Companion</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.patient?.first_name} {record.patient?.last_name}
                        </TableCell>
                        <TableCell>
                          {record.currency} {Number(record.treatment_cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {record.currency} {Number(record.transfer_cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {record.currency} {Number(record.hotel_cost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {record.currency} {Number(record.companion_cost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          -{record.currency} {Number(record.total_discount).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {record.currency} {Number(record.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.payment_status)}</TableCell>
                        <TableCell>
                          {new Date(record.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {editingItem?.type === 'income' ? 'Income' : 'Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingItem?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select value={editForm.currency} onValueChange={(value) => setEditForm({...editForm, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reference">Reference Type</Label>
                <Select value={editForm.reference_type} onValueChange={(value) => setEditForm({...editForm, reference_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reference" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERENCE_TYPES.map(ref => (
                      <SelectItem key={ref.value} value={ref.value}>{ref.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this transaction.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
