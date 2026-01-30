"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table";
import { columns } from "../dashboard/columns";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

import data from "../dashboard/data.json";
import { bookColumns } from "./columns";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { mockBookData } from "./mock-data";

export default function Book() {
  const router = useRouter();

  // Simplified state management for demo
  const [activeTab, setActiveTab] = React.useState("all-books");

  function addBookEventHandler() {
    router.push("/book/create");
  }

  return (
    <>
      <SiteHeader header="Book Management" />
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <Tabs defaultValue="all-books" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all-books">All Books</TabsTrigger>
              <TabsTrigger value="authors">Authors</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>
            <Button onClick={addBookEventHandler}>Add Book</Button>
          </div>

          <TabsContent value="all-books">
            <DataTable data={mockBookData} columns={bookColumns} />
          </TabsContent>
          <TabsContent value="authors">
            <DataTable data={data} columns={columns} />
          </TabsContent>
          <TabsContent value="categories">
            <DataTable data={data} columns={columns} />
          </TabsContent>
          <TabsContent value="inventory">
            <DataTable data={data} columns={columns} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
