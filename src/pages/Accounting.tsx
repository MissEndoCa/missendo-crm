import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
import { Search, DollarSign, TrendingUp, TrendingDown, FileText, Plus, ArrowUpCircle, ArrowDownCircle, Pencil, Trash2, Filter } from 'lucide-react';
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
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Zelle'];

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
  patient_id: string | null;
  payment_method: string | null;
  patient?: {
    first_name: string;
    last_name: string;
  } | null;
  organization?: {
    name: string;
  } | null;
}

const INCOME_CATEGORIES = [
  'Patient Payment',
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
  'Hotel Accommodation',
  'Administrative',
  'Other Expense'
];

const REFERENCE_TYPES = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'patient', label: 'Patient' },
  { value: 'patient_payment', label: 'Patient Payment' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'hotel_booking', label: 'Hotel Booking' },
  { value: 'other', label: 'Other' }
];

export default function Accounting() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpense[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clinicFilter, setClinicFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
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
    payment_method: '',
    notes: ''
  });
  
  const [incomeForm, setIncomeForm] = useState({
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    reference_type: '',
    payment_method: '',
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
      fetchIncomeExpenses();
      fetchOrganizations();
    }
  }, [profile?.organization_id]);

  const fetchIncomeExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('income_expenses')
        .select(`
          *,
          patient:patients (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomeExpenses((data as IncomeExpense[]) || []);
    } catch (error) {
      console.error('Error fetching income/expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
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
        payment_method: incomeForm.payment_method || null,
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
        payment_method: '',
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
      payment_method: item.payment_method || '',
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
          payment_method: editForm.payment_method || null,
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

  const filteredTransactions = incomeExpenses.filter((item) => {
    const patientName = item.patient ? `${item.patient.first_name} ${item.patient.last_name}`.toLowerCase() : '';
    const matchesSearch = searchTerm === '' || 
      patientName.includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || item.payment_method === paymentMethodFilter;
    
    const itemDate = new Date(item.date);
    const matchesDateFrom = !dateFromFilter || itemDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || itemDate <= new Date(dateToFilter);
    
    return matchesSearch && matchesType && matchesCategory && matchesPaymentMethod && matchesDateFrom && matchesDateTo;
  });

  const totalIncome = filteredTransactions
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);
  
  const totalExpense = filteredTransactions
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const netProfit = totalIncome - totalExpense;

  const allCategories = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Accounting</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage financial records and transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
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
                    <Label htmlFor="income-payment-method">Payment Method</Label>
                    <Select value={incomeForm.payment_method} onValueChange={(value) => setIncomeForm({...incomeForm, payment_method: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredTransactions.filter(i => i.type === 'income').length} transactions
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
                {filteredTransactions.filter(i => i.type === 'expense').length} transactions
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
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From Date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
              <Input
                type="date"
                placeholder="To Date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((item) => (
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
                        <TableCell className="font-medium">
                          {item.patient ? `${item.patient.first_name} ${item.patient.last_name}` : '-'}
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.type === 'income' ? '+' : '-'}{item.currency} {Number(item.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{item.payment_method || '-'}</TableCell>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.description || '-'}</TableCell>
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
              {editingItem?.type === 'income' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-method">Payment Method</Label>
                  <Select value={editForm.payment_method} onValueChange={(value) => setEditForm({...editForm, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
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
    </>
  );
}