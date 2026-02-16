# shadcn/ui Usage Guide

This project uses shadcn/ui for UI components. shadcn/ui is not a traditional component library - it provides copy-paste source code that you own and customize.

## Installation

shadcn/ui is NOT installed yet. To add it:

```bash
cd front
npx shadcn-ui@latest init
```

## Adding Components

After initialization, add components with:

```bash
cd front
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add collapsible
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add input
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add toggle
```

## Component Import

Components are imported from `@/components/ui/{component-name}`:

```typescript
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Sheet } from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toggle } from '@/components/ui/toggle'
```

## Key Components for Current Features

### Sidebar (sidebar-001)
- **Collapsible**: For expandable/collapsible menu sections
- **Tooltip**: For showing menu item names when sidebar is collapsed
- **Button**: For toggle button

### Navbar (navbar-001)
- **Button**: For Alti button and user actions
- **DropdownMenu**: For user profile dropdown (profile, settings, logout)
- **Input**: For search bar
- **Sheet**: For mobile navigation drawer
- **ScrollArea**: For horizontal scroll of nav items on mobile

### Chat (chat-001, chat-002)
- **Sheet**: Configure as right-side drawer using `side="right"` prop
- **Button**: For action buttons and view mode toggle
- **Input**: For message input
- **ScrollArea**: For message container
- **Toggle**: For sidebar/full-width mode toggle

## Sheet as Right-Side Drawer

```typescript
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Chat</Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
    {/* Chat content */}
  </SheetContent>
</Sheet>
```

## Dropdown Menu

```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Collapsible

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

<Collapsible>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>
    {/* Collapsible content */}
  </CollapsibleContent>
</Collapsible>
```

## Tooltip

```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost">Icon</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Notes

- Always wrap Tooltip components with TooltipProvider at the app root
- Use `asChild` prop when the trigger is a custom component (like Button)
- Components use Tailwind CSS classes for styling
- Check component documentation at https://ui.shadcn.com for more examples
