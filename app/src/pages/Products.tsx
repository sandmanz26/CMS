import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Callout, PageHeader } from "@/components/common/bits"
import { products as seed } from "@/data/mock"
import { idr } from "@/lib/format"

export default function Products() {
  const [rows, setRows] = useState(seed)
  return (
    <>
      <PageHeader title="Products & Pricing" desc="The catalog and price list used on quotes.">
        <Button onClick={() => toast.info("New product form (mock)")}><Plus />Add product</Button>
      </PageHeader>
      <Callout title="Catalog used on quotes">Only <b>active</b> products appear in the quote builder. Stock under 20 units is flagged “low”; deactivate products that are out of stock.</Callout>
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead>Stock</TableHead><TableHead className="text-right">Sold</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell><TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{idr(p.price)}<span className="text-xs text-muted-foreground"> /{p.unit}</span></TableCell>
                <TableCell>{p.stock === null ? <span className="text-muted-foreground">—</span> : p.stock === 0 ? <Badge variant="outline" className="border-danger/40 text-danger">Out of stock</Badge> : p.stock < 20 ? <Badge variant="outline" className="border-warning/50">Low · {p.stock}</Badge> : p.stock}</TableCell>
                <TableCell className="text-right tabular-nums">{p.sold}</TableCell>
                <TableCell><Switch checked={p.active} onCheckedChange={(c) => { if (c && p.stock === 0) return toast.error(`${p.name} is out of stock`, { description: "Restock before activating it." }); setRows(rows.map((x) => x.id === p.id ? { ...x, active: c } : x)) }} aria-label={`Activate ${p.name}`} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
