# The Malloy Language
Malloy is a new experimental language for querying and modeling data.

Akin to a SQL “extension” it is far easier to use and reason about than SQL, usable in place of SQL, and is quick to pick up for SQL users.

It is reusable and modular, allowing you to model as you go, yet without heavy up-front work before you can start answering complex questions.

Malloy is for anyone who works with SQL--whether you’re an analyst, data scientist, data engineer, or someone building a data application, if you know SQL, Malloy will feel familiar, while more powerful and efficient.

This VSCode plugin is the first application of Malloy. It provides a rich environment to create Malloy models, query, and create simple visualizations and dashboards.

### How it works
- Queries **compile to SQL** and are issued directly to the database
- The language is reusable and composable: everything can be defined once (joins, metrics, aggregations) and later reused and extended.
- **Defaults are smart**, and Malloy  is **concise** where SQL is verbose and often redundant.
- Produces **rich metadata** about query results, as well as the originating column or field (think data lineage). This is ideal for building data applications, and enables construction of interfaces that allow the rewrite of queries to drill into row-level detail.
- ‍ Works in *nested structures* or “graphs” rather than in flat tables, which simplifies querying and aggregation at any nesting depth, and takes advantage of BigQuery’s strengths working with nested data.
- Automatically **builds search indexes** for all the data. Search indexes greatly simplify filtering data and can also be used to understand the ‘shape’ of any given field (min, max, cardinality, most frequent occurring values).
- Currently available on BigQuery, Malloy takes advantage of **BigQuery’s unique features**:
    - Reading and writing large nested result sets extremely fast
    - BI Engine & database-level caching

### Why do we need another data language?
SQL is complete but ugly: everything is expressible, but nothing is reusable; simple ideas are complex to expres; the language is verbose and lacks smart defaults. Malloy is immediately understandable by SQL users, and far easier to use and learn. It is usable in place of SQL to manipulate and explore data.

Key features and advantages:
- Query and model in the same language; everything is reusable and extensible.
- Malloy reads the schema so you don’t need to model everything: Malloy allows creation of re-usable metrics and logic, but there’s no need for boilerplate code that doesn’t add anything new.
- Pipelining: output one query into the next easily for powerful advanced analysis
- Turtles/Named Queries let you delve deeper into data quickly and nest data infinitely
- Queries do more: Power an entire dashboard with a single query. Nested queries are batched together, scanning the data only once.
- Indexes for unified suggest/search: Malloy automatically builds search indexes, making it easier to understand a dataset and filter values.
- Built to optimize the database: make the most of BigQuery, utilizing BI engine, caching, reading/writing nested datasets extremely fast, and more.
- Malloy models are purely about data; visualization and “styles” configurations live separately, keeping the model clean and easy to read.
- Aggregates are safe and accurate: Malloy generates distinct keys when they’re needed to ensure it never fans out your data.
- Nested tables are made approachable: you don’t have to model or flatten them; specify a query path and Malloy handles the rest.
- Compiler-based error checking: Malloy understands sql expressions so the compiler catches errors as you write, before the query is run.

# Join the Community
- Join the [**Malloy Slack Community!**](https://join.slack.com/t/malloy-community/shared_invite/zt-upi18gic-W2saeFu~VfaVM1~HIerJ7w) Use this community to ask questions, meet other Malloy users, and share ideas with one another.
- Use [**GitHub issues**](https://github.com/looker-open-source/malloy/issues) in this Repo to provide feedback, suggest improvements, report bugs, and start new discussions.


# Installation
## Building Malloy

You will need to have BigQuery credentials available, and the [gcloud CLI](https://cloud.google.com/sdk/gcloud) installed.

```
gcloud auth login --update-adc
gcloud config set project <project id> --installation
```

You will need to have [node.js](https://nodejs.org/en/download/), [yarn](https://classic.yarnpkg.com/en/docs/install/), and a [Java Runtime Environment](https://www.oracle.com/java/technologies/javase-jre8-downloads.html) (JRE 1.6 or higher, 1.8 recommended) installed on your system in order to build the Malloy project.

The following will install dependencies for the entire set of packages and compile both the Malloy language and the VSCode extension.

```bash
yarn install
yarn build
```

## Malloy VSCode Extension

The Malloy VSCode extension's source is in the `malloy-vscode` directory.

### Installation

To build and install the current version of the extension, first ensure that you've followed the steps to install the dependencies for the Malloy Repo. **Note: You will need to re-run the below any time you pull in new changes.** Then run:

```bash
yarn install
yarn build
```

Next, in VSCode _EITHER_:
1) Run the "Extensions: Install from VSIX" command (CTRL/CMD + SHIFT + P opens the command interface), then select `/malloy/packages/malloy-vscode/malloy-vscode-x.x.x.vsix`

_OR_

2) Open the `malloy-vscode` package root directory in VSCode, right click on `malloy-vscode-x.x.x.vsix` and select "Install Extension VSIX".

### Contributing
If you would like to [work on Malloy](CONTRIBUTING.md), you can find some helpful instructions about [developing Malloy](developing.md) and [developing documentation](documentation.md).


# Documentation
[Full documentation for Malloy](https://automatic-giggle-2ed8ec13.pages.github.io/documentation/index.html)

- [Basics](https://automatic-giggle-2ed8ec13.pages.github.io/documentation/language/basic.html) - an introduction to the language
- [Example Analysis](https://automatic-giggle-2ed8ec13.pages.github.io/documentation/examples/faa.html) - examples built on the FAA public dataset
- [Modeling Walkthrough](https://automatic-giggle-2ed8ec13.pages.github.io/documentation/examples/iowa/iowa.html) - introduction to modeling via the Iowa liquor sales public data set

# Quick Start Videos

## Using the Malloy VSCode plugin

### Part 1:

https://user-images.githubusercontent.com/7178946/130858341-4e2a834a-ca51-44af-b035-584d6908873f.mov


### Part 2:

https://user-images.githubusercontent.com/7178946/130858354-d92d9ac2-583f-4169-834a-579927b727cd.mov

## Getting Started Video Series
These videos are intended to be viewed in order, but split up to easily navigate (and also because GitHub only allows 100MB video uploads)

### 1. Introduction


https://user-images.githubusercontent.com/7178946/130884531-9f86d536-32b8-43fd-9e4e-17ed316658f1.mov


### 2. Visualizing Results


https://user-images.githubusercontent.com/7178946/130884536-cda8fb91-4c7a-4089-82b6-a61b7371ac65.mov


### 3. Joining


https://user-images.githubusercontent.com/7178946/130884543-8cd4e8ba-116c-441e-b968-c62588e395c3.mov


### 4. Creating a Dashboard


https://user-images.githubusercontent.com/7178946/130884559-9d974707-4180-45a0-b2bc-cd872753ecd6.mov


### 5. Aggregating Subqueries, AKA Turtles


https://user-images.githubusercontent.com/7178946/130884574-e2fb5b1d-3081-43b6-b340-15f4b05b74dd.mov


### 6. Custom Dimensions


https://user-images.githubusercontent.com/7178946/130884587-93960002-9987-4c71-a00d-9be9852539b2.mov


### 7. JSON Renderer


https://user-images.githubusercontent.com/7178946/130884599-31859bf0-844b-444b-b0ac-a164cbe3dcc4.mov


# Introduction: Basic Malloy Syntax & Using the VSCode Plugin
The following written walk-through covers similar concepts to the videos abovem, but in a written format and on a different dataset. 

Malloy queries compile to SQL. As Malloy queries become more complex, the SQL complexity expands dramatically, while the Malloy query remains concise and easier to read.

A couple of key concepts: Queries in Malloy start with a data source, specified either `explore some_named_explore` or `explore 'some_table'`, followed by piped transformations on that data. Fields used in queries may be named using the `is` keyword, which is similar to `AS` in SQL, but reversed.

Let’s illustrate this by asking a straightforward question of a simple ecommerce dataset - how many order items have we sold, broken down by their current status?

```malloy
explore 'malloy-data.ecomm.order_items' | reduce
 status
 order_item_count is count(*)
```

The `reduce` transformation in the above query invokes a `SELECT` with a `GROUP BY` in SQL. Malloy also has a `project` transformation, which will `SELECT` without a `GROUP BY`.

Notice that after you write this, a small “Run” code lens will appear above the query. Click this to run the query. This will produce the following SQL:

```sql
SELECT
  base.status as status,
  COUNT( 1) as order_item_count
FROM malloy-data.ecomm.order_items as base
GROUP BY 1
ORDER BY 2 desc
```

_Note: To see the SQL being generated by your query, open up a New Terminal in the top menu, then select Output, and pick “Malloy” from the menu on the right._

![Kapture 2021-08-18 at 17 07 03](https://user-images.githubusercontent.com/7178946/130125702-7049299a-fe0f-4f50-aaed-1c9016835da7.gif)


Next question: In 2020, how much did we sell to users in each state? This requires filtering to the year 2020, excluding cancelled and returned orders, as well as joining in the users table.
```malloy
explore 'malloy-data.ecomm.order_items'
  users is join ('malloy-data.ecomm.users' primary key id) on user_id
| reduce : [created_at: @2020, status != 'Cancelled' & != 'Returned']
 users.state
 total_sales is sale_price.sum()
```

Note that queries can be filtered at any level, by inserting filter expressions between square brackets. A filter after an explore applies to the whole explore; one before the fields in a `reduce` or `project` transformation applies to that transformation; and one after an aggregate field applies to that aggregate only. See filters documentation for more information on filter expressions. Here's an example with a variety of filter usage:

```malloy
explore order_items : [users.state: 'California' | 'New York' | 'Texas', status: != 'Cancelled' & != 'Processing']
| reduce
  users.state
  total_sale_price_2020 is sale_price.sum() : [created_at : @2020]
  percent_items_returned is 100.0 * (count() : [status : 'Returned']) / count()
```


At this point we might notice we’re defining a few things we might like to re-use, so let’s add them to the model:
```
define users is (explore 'malloy-data.ecomm.users'
  primary key id
);

define order_items is (explore 'malloy-data.ecomm.order_items'
 primary key id
 total_sales is sale_price.sum()
 users is join on user_id);
```

Our query is now very simple:
```malloy
explore order_items | reduce : [created_at: @2020]
 users.state
 total_sales
```

To further simplify, we can add this and a couple other queries we’ll frequently use to our model. Once you define these, the VSCode plugin will supply a “Run” button next to each query:
```malloy

sales_by_state_2020 is (reduce: [created_at: @2020]
   users.state
   total_sales
 )

 orders_by_status is (reduce
   status
   order_count is count(distinct order_id)
 )

 sales_by_month_2020 is (reduce : [created_at : @2020]
   order_month is created_at.month
   total_sales
 )
```

Allowing us to run the following very simple command next time we want to run any of these queries:
```malloy
explore order_items | sales_by_state_2020
```

Our named queries can also now be used anywhere as a nested structure:
```malloy
explore order_items | reduce
 users.state
 total_sales
 orders_by_status
 sales_by_month_2020

```
<img width="844" alt="Screen Shot 2021-08-18 at 3 10 50 PM" src="https://user-images.githubusercontent.com/7178946/130128434-d409edfa-c4b9-4a92-af9a-7ceb241ea0e1.png">


Queries can contain other nested structures, by including additional transformations as fields, so our named query (`sales2020`) can also now be called anywhere as a nested structure. Note that these structures can nest infinitely!:
```malloy
explore order_items | reduce
 users.state
 total_sales
 sales2020
```

Which can be visualized using a data_style
```
{"sales_by_month_2020" : {
   "renderer" : "line_chart"}
, “orders_by_status” : {
   "renderer" : "bar_chart"}
}
```
<img width="899" alt="Screen Shot 2021-08-18 at 4 44 01 PM" src="https://user-images.githubusercontent.com/7178946/130128542-e122eab9-5cf2-48cb-b87c-ce520517d595.png">


Putting a few named queries together as nested structures allows us to produce a dashboard with an overview of sales, having written remarkably little code.

```
state_dashboard is (reduce
 users.state
 total_sales
 order_count
 orders_by_status
 sales_by_month_2020
)
```

<img width="865" alt="Screen Shot 2021-08-19 at 12 01 56 PM" src="https://user-images.githubusercontent.com/7178946/130128823-6b7f8e97-ec28-4ced-9e38-c72384eb976b.png">
