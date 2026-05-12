"""ORION CLI — ``orion architect cycle``, ``orion serve``, ``orion validate``."""

from __future__ import annotations

import asyncio
import logging
import sys

import click
from rich.console import Console
from rich.table import Table

from orion.platform import OrionPlatform
from orion.spine.config import OrionConfig

console = Console()


def _setup_logging(debug: bool) -> None:
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        stream=sys.stderr,
    )


@click.group()
@click.option("--debug", is_flag=True, help="Enable debug logging.")
@click.option("--config", default="orion.yaml", help="Config file path.")
@click.pass_context
def main(ctx: click.Context, debug: bool, config: str) -> None:
    """ORION — The Self-Architecting Eternal Platform."""
    _setup_logging(debug)
    ctx.ensure_object(dict)
    ctx.obj["config"] = OrionConfig.from_yaml(config)
    ctx.obj["debug"] = debug


@main.group()
@click.pass_context
def architect(ctx: click.Context) -> None:
    """Eternal Architect commands."""


@architect.command()
@click.option("--seed", default=None, help="Vision seed to inject.")
@click.pass_context
def cycle(ctx: click.Context, seed: str | None) -> None:
    """Run one full Recursive Self-Improvement Cycle."""
    config: OrionConfig = ctx.obj["config"]

    async def _run() -> None:
        platform = OrionPlatform(config)
        await platform.bootstrap()
        arch = platform.registry.get("architect")
        if arch is None:
            console.print("[red]Architect module not registered.[/red]")
            return
        result = await arch.handle_mcp_call("run_cycle", {"vision_seed": seed})
        console.print_json(data=result)

    asyncio.run(_run())


@architect.command()
@click.argument("seed_text")
@click.pass_context
def seed(ctx: click.Context, seed_text: str) -> None:
    """Inject a vision seed for the next cycle."""
    config: OrionConfig = ctx.obj["config"]

    async def _run() -> None:
        platform = OrionPlatform(config)
        await platform.bootstrap()
        arch = platform.registry.get("architect")
        if arch is None:
            console.print("[red]Architect module not registered.[/red]")
            return
        result = await arch.handle_mcp_call("inject_seed", {"seed": seed_text})
        console.print_json(data=result)

    asyncio.run(_run())


@main.command()
@click.option("--host", default="0.0.0.0", help="Bind host.")
@click.option("--port", default=8900, type=int, help="Bind port.")
@click.pass_context
def serve(ctx: click.Context, host: str, port: int) -> None:
    """Start the ORION API gateway."""
    import uvicorn

    from orion.spine.api_gateway import create_app

    config: OrionConfig = ctx.obj["config"]
    config.host = host
    config.port = port

    async def _bootstrap_and_serve() -> None:
        platform = OrionPlatform(config)
        await platform.bootstrap()
        app = create_app(config, platform.registry, platform.event_bus, platform.provider_manager)
        server_config = uvicorn.Config(app, host=host, port=port)
        server = uvicorn.Server(server_config)
        await server.serve()

    asyncio.run(_bootstrap_and_serve())


@main.command()
@click.pass_context
def validate(ctx: click.Context) -> None:
    """Validate all module contracts."""
    config: OrionConfig = ctx.obj["config"]

    async def _run() -> None:
        platform = OrionPlatform(config)
        await platform.bootstrap()

        table = Table(title="ORION Module Contract Validation")
        table.add_column("Module", style="cyan")
        table.add_column("Version")
        table.add_column("Status", style="green")
        table.add_column("MCP Tools")
        table.add_column("Events")
        table.add_column("Revenue")

        for info in platform.registry.list_modules():
            table.add_row(
                info["name"],
                info["version"],
                "VALID",
                str(len(info["mcp_tools"])),
                str(len(info["event_subscriptions"])),
                str(len(info["revenue_surfaces"])),
            )

        console.print(table)

    asyncio.run(_run())


@main.command()
@click.pass_context
def status(ctx: click.Context) -> None:
    """Show platform status."""
    config: OrionConfig = ctx.obj["config"]

    async def _run() -> None:
        platform = OrionPlatform(config)
        await platform.bootstrap()

        console.print("[bold]ORION Eternal Architect v1.0.0[/bold]")
        console.print(f"Modules registered: {len(platform.registry)}")
        console.print(f"Provider chain: {len(config.default_providers())} provider(s)")

        for info in platform.registry.list_modules():
            console.print(
                f"  [cyan]{info['name']}[/cyan] v{info['version']} — "
                f"{info['description']}"
            )

    asyncio.run(_run())
