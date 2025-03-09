# document-management

document management service

This Nestjs project have following modules

Database Module
AuthModule,
UserModule,
Document Module
AND Ingestion Module

Database Module:
database module have following components:
drizzle provider: drizzle orm is used in this project to connect with database and for queries.
PgBossModule: it is extracted from @wavezync/nestjs-pgboss package, configured in database module to connect with postgresql for PgBoss. PgBoss is redis like queue system(works with posgresql) used for scheduling job in this project.
schema.ts file: this file contain all the table schema and enums used in this project
drizzle.config.ts: this file is in root directory of project and contain code for migration of all table's schema and enums written in drizzle to posgresql database.
All table's schema and enums can be migrated using command "npm run migrate"

Folder Allow Unauthorized Request: This contain allow unauthorized request decorator to allow request that donot have singed token.

AuthModule:
This module serves the purpose of authentication and authorization and pocess following main component for this which should be described:
auth guard: this guard is applied to all apis of this project, used for validating singed jwt token. extract user data from token and store in request. if allow unauthorized decorated is applied on api then with no token it validates api.
role guard: this guard is used for authorization and validates if a user is platform admin. this guard is applied to apis which are for platform admin purpose only.

auth controller: this contain following apis:
@Post sign in api: allow unauthorized request guard is mounted on it. it taken email, password in payload and then if found user with matching password return user data with signed token.
@Post log out api: this api invalidate user's last signed token.

UserModule:
This module is responsibe for all user's profile based interactions. This module pocess following main component which should be described:
user decorator: this param decorator resposible for fetching user's data from request that is added during validating token.
user controller: this contain following apis:
@Post user post api to create user: this api is responsible for creating user.
@Get user profile api: this api returns log in user profile like name ,email.
@Patch user update api: this api is responsible to allow user to update his/her/their name
@Get user all api: this api is responsible for returning 20 likely matching user data(name,email,id) which are likely to match provided email address. it is used when user assign rights of viewer/editor/admin for his/her/their uploaded document
user service specs: this file contain many test cases of user service file business logics.
note: unit test cases are written only for user service file. command to run user service test is: "npm run test:user"

DocumentModule:
This module is resposible for managing documents and contain following main components which should be described:
document controller: this contain following apis:
@Postdocument post api: this api is responsible for upload single document. it process following steps to upload a document:
i. bucket path is generated based on base upload path, user id and current year. here user id and current year is subdirectories of base base upload path.
ii. an upload document job is scheduled using PgBoss.
iii. in the transaction document metadata is inserted in document table with status marks to processing and in userDocRoles table which is responsible for storing user roles for documents an admin role is assigned to user for that document.
iv. success response is send to client
@Get document api: this api is responsible for returing all documents of login user, document's whose status marked completed and are uploaded to directory. its payload provide pagination but maximum limit per page is 100 if input exceeds it and 20 if no limit is provided.

    @Post document assign api: this api is responsible for assigning document role/rights 	(admin/editor/viewer)  to other users. it holds check only admin of document can assign role for that document.

    @Delete document api: this api is responsible for deleting document, it process following steps:
    i. it check if login user have any right on file
    ii. it check  login user should have right of editor or admin for this file,  as only admin and	edior can delete file
    iii. it schedule a job for deleting document from directory using PgBoss.
    iv. in the transaction it delete all the matching records from userDocRole table(responsible for storing roles on docs for users) for that document and then delete metadata of that document from document table
    v. success response is send to client

    @Get document roles api: this api is responsible for returning document based roles.

document worker file: this file is responsible for executing document jobs and contains following two classes.
upload worker: this worker is responsible for storing file in directory and call further ingest job. it procees following steps:
i. directory is created based on bucket.
ii. file is store in bucket.
iii. document status is marked as completed.
iv. find the ingestion type status of 'injectDoc' type of ingestion from ingestion service(ingestion type table)
v. if it find false then false then return if find true then,
vi. find all active routes where ingestion should be done from ingestion service (ingestion route manage table)
vii. for each route create the ingestion record in ingestion tracker table based on contentId: document id (in this case) and route. and schedule a job for ingestion
viii. if it error occur while storing file or updating status, document status is maked as 'Failed'.
delete worker: this delete file from directory

IngestionModule:
this module is reponsible for managing ingestion process and management. it contains following main component which should be described:
Ingestion controller: all the apis in this controller are guarded with authorization of platform role 'admin'. it contains following apis:
@Get ingestion api: this is resposible for returning ingestion processes data from ingestion tracker table based on different optional filters, it includes pagination with maximum limit 100, default limit 20
@Get ingestion based on ingestion id: this api is used for only getting ingestion data from only ingestion tracker table. it is extra and not so useful as above api is returing all its data.
@Post ingestion type manage api: this api responsible for creating ingestion type. its a first step in ingestion. please make sure to create ingestion type' ingestDoc' first to start ingestDoc job.
@Get ingestion type manage api: this is responsible for returning all ingestion type data.
@Patch ingestion type manage api: this api take ingestion type id and status in params and update ingestion type status.
@Post ingestion manage api: this api creates record with routes of a client for specific ingestion type for which ingestion should be done.
@Patch ingestion manage api: this api takes ingestion route manage id and status in param to change status of routes for which ingestion should stop and start.
@Post fetch manage routes: this api returns ingestion route manage data like route, client email from ingestion route manage table based on different optional filters. pagination is optional in it. maximum limit is 100 and default is 20.

ingestion service mock serive: this is mock document embedding service using in place of python service to be called if python service or other services would be there then post api will be trigger for each route.

ingestion worker: this file is responsible for proceeding ingestion job. it follows further steps:
i. hit ingestion mock document embedding service.
ii. if status is not received as 200 then marked ingestion to Failed and throw error and retries for 3 more time
iii. if status is 200 then update status of ingestion to completed.
iv. if an error occur then will then marked ingestion to Failed

Folder lib: in it common file contains common function, enums, class to be used in many modules.

document-upload.load-test file: this file is for load testing on document upload api. to do run testing follow below steps:
in this file in FilePath at line number 11 update file path in same format of double \\ of file that you want for load testing and save file
i. run this command if ts-node is not installed: pnpm install -g ts-node
ii. run this command to start project: npm run start:dev
iii. run this command for starting load testing script: npm run load-test

Guidelines to start project:
run commands:
i. npm i pnpm (if pnpm is not installed)
ii. pnpm i
iii. npm run start:dev

load testing results:
300 concurrent requests for uploading file completed in 3.52 seconds on local machine
