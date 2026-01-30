import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BookPrototype() {
  return <>
    <SiteHeader header="Book Prototype" />
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Tabs defaultValue="all-books" className="w-full">
              {/* Tabs Header */}
              <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
                <TabsTrigger value="all-books">
                  All Books <Badge variant="secondary">124</Badge>
                </TabsTrigger>
                <TabsTrigger value="authors">
                  Authors <Badge variant="secondary">21</Badge>
                </TabsTrigger>
                <TabsTrigger value="categories">
                  Categories <Badge variant="secondary">8</Badge>
                </TabsTrigger>
                <TabsTrigger value="inventory">
                  Inventory <Badge variant="secondary">15</Badge>
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews <Badge variant="secondary">32</Badge>
                </TabsTrigger>
              </TabsList>

              {/* --- TAB CONTENTS --- */}

              {/* All Books Table */}
              <TabsContent value="all-books">
                <Card>
                  <CardHeader>
                    <CardTitle>All Books</CardTitle>
                    <CardDescription>Manage all listed books in your store.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cover</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell><img src="/cover.jpg" className="w-10 h-14 rounded-md" /></TableCell>
                          <TableCell>The Silent Patient</TableCell>
                          <TableCell>Alex Michaelides</TableCell>
                          <TableCell>Thriller</TableCell>
                          <TableCell>$12.99</TableCell>
                          <TableCell>34</TableCell>
                          <TableCell><Badge variant="default">Active</Badge></TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">Edit</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Authors Table */}
              <TabsContent value="authors">
                <Card>
                  <CardHeader>
                    <CardTitle>Authors</CardTitle>
                    <CardDescription>Manage author details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Books</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Brandon Sanderson</TableCell>
                          <TableCell>12</TableCell>
                          <TableCell>USA</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">Edit</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Categories Table */}
              <TabsContent value="categories">
                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Organize your books by genre.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Books Count</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Fantasy</TableCell>
                          <TableCell>45</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">Edit</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Table */}
              <TabsContent value="inventory">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory</CardTitle>
                    <CardDescription>Track stock and pricing details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Dune</TableCell>
                          <TableCell>BK-01923</TableCell>
                          <TableCell>52</TableCell>
                          <TableCell>$19.99</TableCell>
                          <TableCell>2025-10-05</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Table */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>Moderate and manage user feedback.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Atomic Habits</TableCell>
                          <TableCell>Jane Doe</TableCell>
                          <TableCell>⭐⭐⭐⭐⭐</TableCell>
                          <TableCell>Loved it! Very practical.</TableCell>
                          <TableCell>2025-09-29</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive">Delete</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </div>
    </div>
  </>;
}