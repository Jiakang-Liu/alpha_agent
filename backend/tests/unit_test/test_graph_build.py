def test_graph_builds_successfully():
    from backend.graph import build_alpha_graph

    graph = build_alpha_graph()

    assert graph is not None