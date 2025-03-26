"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Upload, Download } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { bulkImportUsers, downloadImportTemplate } from "@/lib/api"

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importRole, setImportRole] = useState<string>("student")
  const [isUploading, setIsUploading] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      // Validate file type
      if (file.type !== "text/csv") {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await downloadImportTemplate(importRole)
      toast({
        title: "Download initiated",
        description: `Template for ${importRole} import has been downloaded.`,
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download template",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      setImportResults(null)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("role", importRole)

      const results = await bulkImportUsers(formData)
      setImportResults(results)

      toast({
        title: "Import completed",
        description: `Successfully imported ${results.successCount} users, with ${results.errorCount} errors.`,
      })
    } catch (error) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import users",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Bulk Import</h1>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Import Users</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Users</CardTitle>
                <CardDescription>Import multiple students or faculty members at once</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="role">Select Role to Import</Label>
                    <Tabs value={importRole} onValueChange={setImportRole} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="student">Students</TabsTrigger>
                        <TabsTrigger value="faculty">Faculty</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div>
                    <Button variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto mb-4">
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Download the CSV template and fill it with user data. Required fields:</p>
                      {importRole === "student" ? (
                        <ul className="list-disc list-inside mt-2">
                          <li>name - Full name of the student</li>
                          <li>email - Email address</li>
                          <li>studentId - Unique student ID</li>
                          <li>batch - Batch year</li>
                          <li>password - Optional. If not provided, a random password will be generated</li>
                        </ul>
                      ) : (
                        <ul className="list-disc list-inside mt-2">
                          <li>name - Full name of the faculty member</li>
                          <li>email - Email address</li>
                          <li>facultyId - Unique faculty ID</li>
                          <li>department - Department name</li>
                          <li>password - Optional. If not provided, a random password will be generated</li>
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="csvFile">Upload CSV File</Label>
                    <div className="mt-2 flex items-center justify-center w-full">
                      <label
                        htmlFor="csvFile"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {selectedFile ? `Selected: ${selectedFile.name}` : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-muted-foreground">CSV files only</p>
                        </div>
                        <Input id="csvFile" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleImport} disabled={!selectedFile || isUploading} className="w-full md:w-auto">
                  {isUploading ? "Importing..." : "Import Users"}
                </Button>
              </CardFooter>
            </Card>

            {importResults && (
              <div className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Import Results</CardTitle>
                    <CardDescription>
                      Processed {importResults.totalProcessed} users, with {importResults.successCount} successful and{" "}
                      {importResults.errorCount} errors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {importResults.results.success.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium flex items-center">
                            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                            Successfully Imported ({importResults.results.success.length})
                          </h3>
                          <div className="mt-2 rounded-md border overflow-auto max-h-40">
                            <table className="min-w-full divide-y">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    Email
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                    {importRole === "student" ? "Student ID" : "Faculty ID"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {importResults.results.success.map((user: any, index: number) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm">{user.name}</td>
                                    <td className="px-4 py-2 text-sm">{user.email}</td>
                                    <td className="px-4 py-2 text-sm">
                                      {importRole === "student" ? user.studentId : user.facultyId}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {importResults.results.error.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium flex items-center">
                            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                            Import Errors ({importResults.results.error.length})
                          </h3>
                          <div className="mt-2 space-y-2">
                            {importResults.results.error.map((item: any, index: number) => (
                              <Alert variant="destructive" key={index}>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error for {item.userData.name}</AlertTitle>
                                <AlertDescription>{item.error}</AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

