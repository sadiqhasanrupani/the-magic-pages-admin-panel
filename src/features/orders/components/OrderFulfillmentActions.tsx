'use client';

import {
  IconCheck,
  IconCopy,
  IconDotsVertical,
  IconEye,
  IconTruck,
} from '@tabler/icons-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { AdminOrder } from '../types/orders.types';
import { nextFulfillmentActions } from '../types/orders.types';
import { MarkDeliveredDialog } from './MarkDeliveredDialog';
import { MarkShippedDialog } from './MarkShippedDialog';

interface OrderFulfillmentActionsProps {
  order: AdminOrder;
  /**
   * `menu` — compact dropdown for a table row.
   * `buttons` — inline buttons for the detail header.
   */
  variant?: 'menu' | 'buttons';
}

/**
 * The single place that decides which fulfilment actions an order may take.
 *
 * Shared by the table's row-actions column and the detail view's header so the
 * two can never disagree about what is offered. Which actions appear comes from
 * `nextFulfillmentActions(order.status)`, the client-side mirror of the
 * server's transition guards.
 *
 * The dialogs are rendered as SIBLINGS of the DropdownMenu, not children. A
 * Radix dropdown unmounts its content on close, which would tear down a dialog
 * nested inside it the instant the triggering item was clicked; hoisting them
 * out and driving them from local state is the supported pattern.
 */
export function OrderFulfillmentActions({
  order,
  variant = 'menu',
}: OrderFulfillmentActionsProps) {
  const [shipOpen, setShipOpen] = React.useState(false);
  const [deliverOpen, setDeliverOpen] = React.useState(false);

  const allowed = nextFulfillmentActions(order.status);
  // The server's transition map has no concept of line items — it will accept
  // a SHIPPED move on a digital-only order exactly as happily as a physical
  // one, because a paid digital order just sits at NOT_STARTED/PROCESSING
  // forever (DigitalDeliveryService owns its lifecycle instead). Gating on
  // physical presence here is the only thing stopping an admin from
  // "shipping" a book that was never printed.
  const hasPhysicalItems = order.items.some((item) => !item.isDigital);
  const canShip = allowed.includes('SHIPPED') && hasPhysicalItems;
  const canDeliver = allowed.includes('DELIVERED');

  const dialogs = (
    <>
      {canShip && (
        <MarkShippedDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          open={shipOpen}
          onOpenChange={setShipOpen}
        />
      )}
      {canDeliver && (
        <MarkDeliveredDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          open={deliverOpen}
          onOpenChange={setDeliverOpen}
        />
      )}
    </>
  );

  if (variant === 'buttons') {
    return (
      <>
        <div className="flex items-center gap-2">
          {canShip && (
            <Button onClick={() => setShipOpen(true)}>
              <IconTruck className="mr-2 h-4 w-4" aria-hidden="true" />
              Mark shipped
            </Button>
          )}
          {canDeliver && (
            <Button onClick={() => setDeliverOpen(true)}>
              <IconCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Mark delivered
            </Button>
          )}
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">
              Open actions for order {order.orderNumber}
            </span>
            <IconDotsVertical className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}`}>
              <IconEye className="mr-2 h-4 w-4" aria-hidden="true" />
              View details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(order.orderNumber);
              toast.success('Order number copied.');
            }}
          >
            <IconCopy className="mr-2 h-4 w-4" aria-hidden="true" />
            Copy order #
          </DropdownMenuItem>

          {(canShip || canDeliver) && <DropdownMenuSeparator />}

          {canShip && (
            // onSelect + preventDefault, not onClick: letting the menu close
            // itself first races the dialog's mount and the dialog can be lost.
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setShipOpen(true);
              }}
            >
              <IconTruck className="mr-2 h-4 w-4" aria-hidden="true" />
              Mark shipped
            </DropdownMenuItem>
          )}

          {canDeliver && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setDeliverOpen(true);
              }}
            >
              <IconCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Mark delivered
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogs}
    </>
  );
}
