export async function GET() {
  // Server-side code here
  // const bunEqual = Bun.deepEquals({ hi: "there" }, {hi: "there"});
  // console.log("bunEqual: ", bunEqual);
  return Response.json({ message: 'Hello from server!' });
}
