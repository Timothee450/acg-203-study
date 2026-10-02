/* Chapter registry. To add a chapter, append an entry and create chapters/<id>/.
   Chapters keep the textbook's numbers (the course skips Chapter 12). */
window.CHAPTERS = [
  { id: "ch1", num: 1, title: "Managerial Accounting and Cost Concepts",
    summary: "The vocabulary of cost: direct vs indirect, materials, labor and overhead, product vs period costs, how costs behave as activity changes, which costs matter for a decision, and the contribution format income statement.",
    href: "chapters/ch1/index.html" },
  { id: "ch2", num: 2, title: "Job-Order Costing: Calculating Unit Product Costs",
    summary: "Costing work done to order: job cost sheets, the predetermined overhead rate, applying overhead to jobs, total and unit job cost, departmental rates, and under- or overapplied overhead.",
    href: "chapters/ch2/index.html" },
  { id: "ch3", num: 3, title: "Job-Order Costing: Cost Flows and External Reporting",
    summary: "Following a month of costs through the books: journal entries and T-accounts, the schedules of cost of goods manufactured and cost of goods sold, the income statement, and closing under- or overapplied overhead.",
    href: "chapters/ch3/index.html" },
  { id: "ch4", num: 4, title: "Process Costing",
    summary: "Costing identical units made nonstop: processing departments and transfers between them, conversion cost, equivalent units with the weighted-average method, cost per equivalent unit, the cost reconciliation, and operation costing.",
    href: "chapters/ch4/index.html" }
];
