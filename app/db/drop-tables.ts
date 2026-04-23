import mysql from "mysql2/promise";

async function dropTables() {
  const connection = await mysql.createConnection({
    host: "ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com",
    port: 4000,
    user: "3EQPJAcsbQsBKtG.root",
    password: "5etGcSFhTyVQXjhrUCZfhnDPbne1Gu4T",
    database: "19dbaac9-9242-85ec-8000-09d1d317212c",
  });

  await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
  await connection.execute("DROP TABLE IF EXISTS contacts");
  await connection.execute("DROP TABLE IF EXISTS post_tags");
  await connection.execute("DROP TABLE IF EXISTS tags");
  await connection.execute("DROP TABLE IF EXISTS images");
  await connection.execute("DROP TABLE IF EXISTS posts");
  await connection.execute("DROP TABLE IF EXISTS users");
  await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

  console.log("All tables dropped.");
  await connection.end();
}

dropTables().catch(console.error);
