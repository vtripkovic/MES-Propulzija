"use client";

import { useState } from "react";
import type { BomNode } from "./product-types";

type BomTreeProps = {
  node: BomNode;
  parentId: string;
  level: number;
  saving: boolean;
  onUpdateQuantity: (
    parentId: string,
    itemId: string,
    quantity: number,
  ) => Promise<void>;
  onDelete: (
    parentId: string,
    itemId: string,
    componentName: string,
  ) => Promise<void>;
};

export function BomTree({
  node,
  parentId,
  level,
  saving,
  onUpdateQuantity,
  onDelete,
}: BomTreeProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(node.quantity));

  const hasChildren = node.children.length > 0;

  async function saveQuantity() {
    const value = Number(editQuantity);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    await onUpdateQuantity(parentId, node.id, value);
    setEditing(false);
  }

  return (
    <div>
      <div
        className="flex flex-col gap-3 px-4 py-4 hover:bg-gray-50 md:flex-row md:items-center"
        style={{
          paddingLeft: `${level * 32 + 16}px`,
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (hasChildren) {
                setExpanded((value) => !value);
              }
            }}
            disabled={!hasChildren}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs ${
              hasChildren
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "cursor-default text-gray-300"
            }`}
          >
            {hasChildren ? (expanded ? "▼" : "▶") : "•"}
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-900">
                {node.child.code}
              </span>

              <span className="text-gray-700">{node.child.name}</span>

              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                Rev. {node.child.revision}
              </span>
            </div>

            {hasChildren && (
              <div className="mt-1 text-xs text-gray-400">
                {node.children.length}{" "}
                {node.children.length === 1 ? "komponenta" : "komponente"}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:w-64 md:justify-end">
          {editing ? (
            <>
              <input
                type="number"
                min="0.01"
                step="any"
                value={editQuantity}
                onChange={(event) => setEditQuantity(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void saveQuantity();
                  }

                  if (event.key === "Escape") {
                    setEditQuantity(String(node.quantity));
                    setEditing(false);
                  }
                }}
                autoFocus
                disabled={saving}
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  void saveQuantity();
                }}
                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Sačuvaj
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditQuantity(String(node.quantity));
                  setEditing(false);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                ×
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-gray-700">
                × {node.quantity}
              </span>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditQuantity(String(node.quantity));
                  setEditing(true);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Izmeni
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => {
            void onDelete(parentId, node.id, node.child.name);
          }}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Obriši
        </button>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <BomTree
              key={child.id}
              node={child}
              parentId={node.child.id}
              level={level + 1}
              saving={saving}
              onUpdateQuantity={onUpdateQuantity}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
