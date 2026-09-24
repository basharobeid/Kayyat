"""RFC 7807 Problem Details for every error the API returns."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_BASE = "https://khayyat.app/errors/"
PROBLEM_MEDIA_TYPE = "application/problem+json"


class ProblemError(Exception):
    def __init__(
        self,
        status: int,
        title: str,
        detail: str | None = None,
        *,
        type_: str = "about:blank",
        errors: list[dict[str, Any]] | None = None,
        headers: dict[str, str] | None = None,
    ):
        self.status = status
        self.title = title
        self.detail = detail
        self.type = type_ if type_ == "about:blank" else PROBLEM_BASE + type_
        self.errors = errors
        self.headers = headers


class NotFound(ProblemError):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(404, "Not Found", detail, type_="not-found")


class Conflict(ProblemError):
    def __init__(self, detail: str):
        super().__init__(409, "Conflict", detail, type_="conflict")


class Unauthorized(ProblemError):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(
            401, "Unauthorized", detail, type_="unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )


class Forbidden(ProblemError):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(403, "Forbidden", detail, type_="forbidden")


def _problem(request: Request, status: int, title: str, detail: str | None, type_: str,
             errors: list[dict[str, Any]] | None = None,
             headers: dict[str, str] | None = None) -> JSONResponse:
    body: dict[str, Any] = {
        "type": type_,
        "title": title,
        "status": status,
        "instance": request.url.path,
    }
    if detail:
        body["detail"] = detail
    if errors:
        body["errors"] = errors
    return JSONResponse(body, status_code=status, media_type=PROBLEM_MEDIA_TYPE, headers=headers)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProblemError)
    async def _problem_error(request: Request, exc: ProblemError):
        return _problem(request, exc.status, exc.title, exc.detail, exc.type, exc.errors,
                        exc.headers)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError):
        errors = [
            {
                # Drop the "body"/"query" prefix so clients can map straight to form fields.
                "field": ".".join(str(p) for p in err["loc"][1:]) or str(err["loc"][0]),
                "message": err["msg"],
            }
            for err in exc.errors()
        ]
        return _problem(request, 422, "Validation Error", "One or more fields are invalid",
                        PROBLEM_BASE + "validation", errors)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(request: Request, exc: StarletteHTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else None
        title = {404: "Not Found", 405: "Method Not Allowed"}.get(exc.status_code, "Error")
        return _problem(request, exc.status_code, title, detail, "about:blank",
                        headers=getattr(exc, "headers", None))
