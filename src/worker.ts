import dashboardHtml from "../dist/index.html?raw";
import atkinsonBold from "../public/fonts/atkinson-bold.woff";
import atkinsonRegular from "../public/fonts/atkinson-regular.woff";
import { handleEmployeesApi } from "./employees";
import favicon from "./favicon.txt";

type StaticResponse = {
	body: BodyInit;
	contentType: string;
};

const staticFiles = new Map<string, StaticResponse>([
	["/favicon.svg", { body: favicon, contentType: "image/svg+xml; charset=utf-8" }],
	["/fonts/atkinson-regular.woff", { body: atkinsonRegular, contentType: "font/woff" }],
	["/fonts/atkinson-bold.woff", { body: atkinsonBold, contentType: "font/woff" }],
]);

function jsonResponse(value: unknown, status = 200): Response {
	return Response.json(value, {
		status,
		headers: {
			"Cache-Control": "private, no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

function serializeForHtml(value: unknown): string {
	return JSON.stringify(value)
		.replaceAll("<", "\\u003c")
		.replaceAll(">", "\\u003e")
		.replaceAll("&", "\\u0026");
}

async function authenticatedIdentity(ctx: ExecutionContext) {
	if (!ctx.access) return null;

	const identity = await ctx.access.getIdentity();
	if (!identity) return null;

	return {
		aud: ctx.access.aud,
		identity,
	};
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url);
			const staticFile = staticFiles.get(url.pathname);

			if (staticFile && (request.method === "GET" || request.method === "HEAD")) {
				return new Response(request.method === "HEAD" ? null : staticFile.body, {
					headers: {
						"Cache-Control": "public, max-age=31536000, immutable",
						"Content-Type": staticFile.contentType,
						"X-Content-Type-Options": "nosniff",
					},
				});
			}

			const access = await authenticatedIdentity(ctx);

			if (!access) {
				return jsonResponse(
					{
						error: "access_required",
						message: "Cloudflare Access did not authenticate this request.",
					},
					403,
				);
			}

			if (url.pathname === "/api/access-identity") {
				if (request.method !== "GET") {
					return new Response(null, { status: 405, headers: { Allow: "GET" } });
				}
				return jsonResponse(access);
			}

			const employeesResponse = await handleEmployeesApi(request, env.HRIS_DB);
			if (employeesResponse) return employeesResponse;

			if ((url.pathname === "/" || url.pathname === "/index.html") && (request.method === "GET" || request.method === "HEAD")) {
				const html = dashboardHtml.replace("__ACCESS_IDENTITY_JSON__", serializeForHtml(access));
				return new Response(request.method === "HEAD" ? null : html, {
					headers: {
						"Cache-Control": "private, no-store",
						"Content-Type": "text/html; charset=utf-8",
						"Vary": "Cookie",
						"X-Content-Type-Options": "nosniff",
					},
				});
			}

			return new Response("Not found", { status: 404 });
		} catch (error) {
			console.error(JSON.stringify({
				message: "Unhandled Worker request error",
				error: error instanceof Error ? error.message : String(error),
				path: new URL(request.url).pathname,
			}));
			return jsonResponse({ error: "internal_error", message: "The request could not be completed." }, 500);
		}
	},
} satisfies ExportedHandler<Env>;
