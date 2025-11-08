"use client";

import * as React from "react";
import { columns, DataTable, TabsContent } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";

import data from "../dashboard/data.json";
import { bookColumns } from "./columns";
import { useRouter } from "next/navigation";

type Action =
  | { type: "ALL-BOOKS" }
  | { type: "AUTHORS" }
  | { type: "CATEGORIES" }
  | { type: "INVENTORY" };

export type ActiveTab = "all-books" | "authors" | "categories" | "inventory";

export default function Book() {
  const router = useRouter();

  type InitialDataTableState = {
    data: any;
    columns: any;
    addSectionOnClickHandler: (event: React.MouseEvent) => void;
    addSectionName: string;
    initialActiveTab: ActiveTab;
  };

  const initialDataTableState: InitialDataTableState = {
    data: data,
    columns: bookColumns,
    addSectionOnClickHandler: () => {},
    addSectionName: "Add Book",
    initialActiveTab: "all-books",
  };

  function bookDataTableReducer(state: any, action: Action) {
    switch (action.type) {
      case "ALL-BOOKS":
        return initialDataTableState;
      case "AUTHORS":
        return {
          ...state,
          columns: columns,
        };
      case "CATEGORIES":
        return {
          ...state,
          columns: columns,
        };
      case "INVENTORY":
        return {
          ...state,
          columns: columns,
        };
      default:
        throw new Error();
    }
  }

  const [state, dispatch] = React.useReducer(
    bookDataTableReducer,
    initialDataTableState,
  );

  const tabsContents: TabsContent[] = [
    { content: <p>All Book</p>, value: "all-books", columns: bookColumns },
    { content: <p>Authors</p>, value: "authors", columns: columns },
    { content: <p>Categories</p>, value: "categories", columns: columns },
    { content: <p>Inventory</p>, value: "inventory", columns: columns },
    // #Todo: Future feature
    // { item: <p>Reviews</p>, value: "Reviews" },
  ];

  function addBookEventHandler(_event: React.MouseEvent) {
    router.push("/book/create");
  }

  return (
    <>
      <SiteHeader header="Book Management" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataTable
              data={data}
              tabs={tabsContents}
              initialActiveTab={"all-books"}
              addSectionName="Add Book"
              addSectionOnClickHandler={addBookEventHandler}
            />
          </div>
        </div>
      </div>
    </>
  );
}
