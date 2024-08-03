import React, { useCallback, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApMapping, SurveyPoint } from "@/lib/types";
import { Switch } from "./ui/switch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { rssiToPercentage } from "@/lib/utils";
import { AlertDialogModal } from "./AlertDialogModal";
import { PopoverHelper } from "./PopoverHelpText";

type FlattenedSurveyPoint = {
  id: string;
  x: number;
  y: number;
  ssid: string;
  bssid: string;
  rssi: number;
  channel: number;
  security: string;
  txRate: number;
  phyMode: string;
  channelWidth: number;
  frequency: string;
  tcpDownloadMbps: number;
  tcpUploadMbps: number;
  udpDownloadMbps: number;
  udpUploadMbps: number;
  timestamp: string;
  isDisabled: boolean;
};

interface SurveyPointsTableProps {
  data: SurveyPoint[];
  onDelete: (ids: string[]) => void;
  updateDatapoint: (id: string, data: Partial<SurveyPoint>) => void;
  apMapping: ApMapping[];
}

const SurveyPointsTable: React.FC<SurveyPointsTableProps> = ({
  data,
  onDelete,
  updateDatapoint,
  apMapping,
}) => {
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    id: true,
    signalQuality: true,
    bssid: true,
    frequency: true,
    tcpDownloadMbps: true,
    tcpUploadMbps: true,
    timestamp: true,
    disable: true,
    rssi: false,
    ssid: false,
    security: false,
    txRate: false,
    phyMode: false,
    channelWidth: false,
    channel: false,
    x: false,
    y: false,
  });

  const columns: ColumnDef<FlattenedSurveyPoint>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: "ID",
      },
      {
        id: "disable",
        header: () => (
          <>
            Disable
            <span className="ml-1 relative -top-0.5">
              <PopoverHelper text="Disabling a point will prevent it from being used in the heatmap." />
            </span>
          </>
        ),
        cell: ({ row }) => (
          <Switch
            checked={row.original.isDisabled}
            onCheckedChange={(value) => {
              const id = row.original.id;
              updateDatapoint(id, { isDisabled: value });
            }}
          />
        ),
        accessorKey: "isDisabled",
        enableSorting: true,
      },
      {
        accessorKey: "rssi",
        header: "RSSI [dBm]",
      },
      {
        accessorKey: "signalQuality",
        header: "Signal Quality [%]",
      },
      {
        accessorKey: "bssid",
        header: "BSSID",
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
      },
      {
        accessorKey: "channel",
        header: "Channel",
      },
      {
        accessorKey: "tcpDownloadMbps",
        header: "TCP Down [Mbps]",
      },
      {
        accessorKey: "tcpUploadMbps",
        header: "TCP Up [Mbps]",
      },
      {
        accessorKey: "udpDownloadMbps",
        header: "UDP Down [Mbps]",
      },
      {
        accessorKey: "udpUploadMbps",
        header: "UDP Up [Mbps]",
      },
      {
        accessorKey: "timestamp",
        header: "Timestamp",
      },
      {
        accessorKey: "ssid",
        header: "SSID",
      },
      {
        accessorKey: "security",
        header: "Security",
      },
      {
        accessorKey: "txRate",
        header: "TX Rate",
      },
      {
        accessorKey: "phyMode",
        header: "PHY Mode",
      },
      {
        accessorKey: "channelWidth",
        header: "Channel Width",
      },

      {
        accessorKey: "x",
        header: "X",
      },
      {
        accessorKey: "y",
        header: "Y",
      },
    ],
    [updateDatapoint],
  );

  const convertToMbps = (bitsPerSecond: number) => {
    return Math.round((bitsPerSecond / 1000000) * 100) / 100;
  };

  const flattenedData: FlattenedSurveyPoint[] = useMemo(() => {
    return data.map((point) => {
      let bssid = point.wifiData.bssid;
      if (apMapping.length > 0) {
        const mappedName = apMapping.find(
          (ap) => ap.macAddress === point.wifiData.bssid,
        )?.apName;
        if (mappedName) {
          bssid = `${mappedName} (${point.wifiData.bssid})`;
        }
      }
      return {
        ...point,
        ...point.wifiData,
        bssid,
        tcpDownloadMbps: convertToMbps(
          point.iperfResults.tcpDownload.bitsPerSecond,
        ),
        tcpUploadMbps: convertToMbps(
          point.iperfResults.tcpUpload.bitsPerSecond,
        ),
        udpDownloadMbps: convertToMbps(
          point.iperfResults.udpDownload.bitsPerSecond,
        ),
        udpUploadMbps: convertToMbps(
          point.iperfResults.udpUpload.bitsPerSecond,
        ),
        signalQuality: rssiToPercentage(point.wifiData.rssi),
        frequency: `${point.wifiData.frequency} Mhz`,
        timestamp: new Date(point.timestamp).toLocaleString(),
      };
    });
  }, [data, apMapping]);

  const table = useReactTable({
    data: flattenedData,
    columns,
    state: {
      rowSelection,
      globalFilter,
      columnVisibility,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleDelete = useCallback(() => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => flattenedData[parseInt(index)].id,
    );
    onDelete(selectedIds);
  }, [rowSelection, flattenedData, onDelete]);

  const toggleDisableSelected = useCallback(() => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => flattenedData[parseInt(index)].id,
    );
    const allHidden = selectedIds.every(
      (id) => flattenedData.find((point) => point.id === id)?.isDisabled,
    );
    selectedIds.forEach((id) => {
      updateDatapoint(id, { isDisabled: !allHidden });
    });
  }, [rowSelection, flattenedData, updateDatapoint]);

  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold mt-4">Measurement Points</div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <span className="text-md text-gray-700 min-w-fit">
            {Object.keys(rowSelection).length} of {flattenedData.length} row(s)
            selected
          </span>
        </div>
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Show Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.columnDef.header?.toString() ?? column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.toggleAllRowsSelected(false)}
            disabled={Object.keys(rowSelection).length === 0}
          >
            Deselect All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.toggleAllRowsSelected(true)}
          >
            Select All
          </Button>
          <AlertDialogModal
            title="Delete Selected"
            description="Are you sure you want to delete the selected rows?"
            onConfirm={handleDelete}
            onCancel={() => {}}
            disabled={Object.keys(rowSelection).length === 0}
          >
            <Button
              variant="destructive"
              size="sm"
              className={`${Object.keys(rowSelection).length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Delete Selected
            </Button>
          </AlertDialogModal>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleDisableSelected}
            disabled={Object.keys(rowSelection).length === 0}
          >
            Toggle Disable Selected
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: `${
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          } flex items-center justify-center whitespace-nowrap`,
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <ChevronUp className="ml-2 h-4 w-4" />,
                          desc: <ChevronDown className="ml-2 h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ??
                          (header.column.getCanSort() ? (
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          ) : null)}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${
                    row.getIsSelected()
                      ? "bg-primary/10"
                      : i % 2 === 0
                        ? "bg-muted/50"
                        : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default SurveyPointsTable;