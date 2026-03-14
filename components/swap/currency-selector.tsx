'use client'

import { IconChevronDown } from '@tabler/icons-react'
import { useCurrency } from '@/hooks/use-currency'
import { CURRENCIES } from '@/config/currencies'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        aria-label="Select display currency"
      >
        <span>{currency.flag}</span>
        <span className="font-mono">{currency.code}</span>
        <IconChevronDown className="size-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Display currency</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={currency.code}
          onValueChange={setCurrency}
        >
          {CURRENCIES.map((c) => (
            <DropdownMenuRadioItem key={c.code} value={c.code}>
              <span className="mr-2">{c.flag}</span>
              <span className="font-mono">{c.code}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
